package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"strconv"

	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/views"
)

// @Summary      Make a deposit
// @Description  Deposits funds to the user's account via PayPal and returns a redirect URL
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        request body     dto.DepositRequest  true  "Deposit request"
// @Success      201    {object}  dto.JSONAnswer      "Deposit initiated, redirect to payment gateway"
// @Failure      400    {object}  dto.JSONAnswer      "Invalid request"
// @Failure      500    {object}  dto.JSONAnswer      "Internal server error"
// @Header       201    {string}  Location            "URL to redirect user for completing payment"
// @Router       /api/payments/deposit [post]
func (h *Handler) handleDeposit(w http.ResponseWriter, r *http.Request) {
	var req dto.DepositRequest

	token, err := r.Cookie("token")
	if err == nil {
		_, err = h.jwtMng.ValidateToken(token.Value)
		if err != nil {
			h.Logout(w, r)
			views.WriteError(w, http.StatusUnauthorized, entities.ErrInvalidToken)
			return
		}
	}
	userIDStr, _ := auth.GetUserIDFromContext(r.Context())
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	// Lie to the client who is trying to brute force the token
	if err != nil {
		views.WriteError(w, http.StatusUnauthorized, entities.ErrMissingToken)
		h.Logout(w, r)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, redirectURL, err := h.service.PaymentService.RequestDeposit(context.Background(), userID, req.Amount)
	if err != nil {
		log.Println(err)
		jsonResponse(w, 400, dto.JSONAnswer{Message: err.Error()})
		return
	}

	w.Header().Add("Location", redirectURL)
	w.WriteHeader(http.StatusMovedPermanently)
}

// @Summary      Pay for a booking
// @Description  Pays for a booking using the user's balance
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        request body     dto.BookingPaymentRequest  true  "Booking payment request"
// @Success      200    {object}  dto.JSONAnswer             "Payment successful"
// @Failure      400    {object}  dto.JSONAnswer             "Invalid request"
// @Failure      402    {object}  dto.JSONAnswer             "Insufficient balance"
// @Failure      500    {object}  dto.JSONAnswer             "Internal server error"
// @Router       /api/payments/booking [post]
func (h *Handler) handleBookingPayment(w http.ResponseWriter, r *http.Request) {
	var booking entities.Booking
	if err := json.NewDecoder(r.Body).Decode(&booking); err != nil {
		slog.Error("Error decoding booking payment request:", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	token, err := r.Cookie("token")
	if err == nil {
		_, err = h.jwtMng.ValidateToken(token.Value)
		if err != nil {
			h.Logout(w, r)
			views.WriteError(w, http.StatusUnauthorized, entities.ErrInvalidToken)
			return
		}
	}
	userIDStr, _ := auth.GetUserIDFromContext(r.Context())
	userID, _ := strconv.ParseInt(userIDStr, 10, 64)

	booking.UserID = userID

	if err := h.service.PaymentService.PayBooking(r.Context(), &booking); err != nil {
		slog.Error("Error processing booking payment:", "error", err)

		var status int
		switch {
		case errors.Is(err, entities.ErrInsufficientBalance):
			status = http.StatusPaymentRequired
		default:
			status = http.StatusInternalServerError
		}

		jsonResponse(w, status, dto.JSONAnswer{
			Message: "Payment failed",
		})
		return
	}

	jsonResponse(w, http.StatusOK, dto.JSONAnswer{
		Message: "Payment successful",
	})
}

// @Summary      Cancel booking and refund
// @Description  Cancels a booking and refunds the payment to the user
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        id   path      int64           true  "Booking ID"
// @Success      200  {object}  dto.JSONAnswer  "Refund successful"
// @Failure      400  {object}  dto.JSONAnswer  "Invalid booking ID"
// @Failure      404  {object}  dto.JSONAnswer  "Booking not found"
// @Failure      500  {object}  dto.JSONAnswer  "Internal server error"
// @Router       /api/payments/bookings/{id} [delete]
func (s *Handler) handleBookingRefund(w http.ResponseWriter, r *http.Request) {
	var req dto.BookingPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Error decoding booking payment request:", "error", err, "id", req.BookingID)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if err := s.service.PaymentService.CancelBooking(r.Context(), req.BookingID); err != nil {
		s.logger.Error("Error processing booking refund:", "error", err, "id", req.BookingID)
		http.Error(w, "Refund failed", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, dto.JSONAnswer{
		Message: "Refund successful",
	})
}

// This API is not intended to be used by other sources than PayPal
func (h *Handler) handleWebhook(w http.ResponseWriter, r *http.Request) {
	// 1. Verify this is a genuine PayPal webhook
	if err := h.service.PaymentService.VerifyWebhook(r.Context(), r); err != nil {
		h.logger.Error("webhook verification failed", "error", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Read and parse the request body
	var event map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		h.logger.Error("invalid payload", "error", err)
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	// 3. Log the incoming event for debugging
	h.logger.Info("PayPal webhook received", "event_type", event["event_type"])

	// 4. Process CHECKOUT.ORDER.APPROVED events
	if event["event_type"] == "CHECKOUT.ORDER.APPROVED" {
		if err := h.processApprovedOrder(event); err != nil {
			h.logger.Error("order processing failed", "error", err)
			http.Error(w, "Order processing failed", http.StatusBadRequest)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) processApprovedOrder(event map[string]interface{}) error {
	// 1. Extract resource data with safety checks
	resource, ok := event["resource"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid resource format")
	}

	// 2. Extract purchase units
	purchaseUnits, ok := resource["purchase_units"].([]interface{})
	if !ok || len(purchaseUnits) == 0 {
		return fmt.Errorf("no purchase units found")
	}

	// 3. Get first purchase unit
	firstUnit, ok := purchaseUnits[0].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid purchase unit format")
	}

	// 4. Extract custom_id (userID)
	rawUserID, ok := firstUnit["custom_id"].(string)
	if !ok {
		return fmt.Errorf("custom_id missing or invalid")
	}

	// 5. Convert userID to int64
	userID, err := strconv.ParseInt(rawUserID, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid userID format: %v", err)
	}

	// 6. Extract amount
	amount, err := h.getAmountFromOrder(resource)
	if err != nil {
		return fmt.Errorf("failed to get amount: %v", err)
	}

	// 7. Process payment
	if err := h.service.PaymentService.Deposit(context.Background(), userID, amount); err != nil {
		return fmt.Errorf("deposit failed: %v", err)
	}

	// 8. Log success
	h.logger.Info("Payment processed successfully",
		"userID", userID,
		"amount", amount,
		"paypalID", resource["id"],
	)

	return nil
}

func (h *Handler) getAmountFromOrder(resource map[string]interface{}) (float64, error) {
	purchaseUnits, ok := resource["purchase_units"].([]interface{})
	if !ok || len(purchaseUnits) == 0 {
		return 0, fmt.Errorf("no purchase units")
	}

	firstUnit, ok := purchaseUnits[0].(map[string]interface{})
	if !ok {
		return 0, fmt.Errorf("invalid purchase unit")
	}

	amountData, ok := firstUnit["amount"].(map[string]interface{})
	if !ok {
		return 0, fmt.Errorf("amount data missing")
	}

	valueStr, ok := amountData["value"].(string)
	if !ok {
		return 0, fmt.Errorf("amount value missing")
	}

	amount, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid amount format: %v", err)
	}

	return amount, nil
}

// Helper function for consistent JSON responses
func jsonResponse(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Error("Error encoding JSON response:", err)
	}
}
