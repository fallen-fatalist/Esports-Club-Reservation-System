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

	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
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
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, redirectURL, err := h.service.PaymentService.RequestDeposit(context.Background(), req.UserID, req.Amount)
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
// @Router       /api/payments/bookings [post]
func (s *Handler) handleBookingPayment(w http.ResponseWriter, r *http.Request) {
	var booking entities.Booking
	if err := json.NewDecoder(r.Body).Decode(&booking); err != nil {
		slog.Error("Error decoding booking payment request:", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if err := s.service.PaymentService.PayBooking(r.Context(), &booking); err != nil {
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

func (h *Handler) handleWebhook(w http.ResponseWriter, r *http.Request) {
	var event map[string]interface{}

	err := json.NewDecoder(r.Body).Decode(&event)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	eventType, ok := event["event_type"].(string)
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	switch eventType {
	case "PAYMENT.CAPTURE.COMPLETED":
		resource := event["resource"].(map[string]interface{})

		rawUserID, exists := resource["custom_id"].(string)
		if !exists {
			// IMPORTANT: implement refund logic here
			h.logger.Error("user completed payment, but didn't recieve funds", "metadata", resource)
			http.Error(w, "user completed payment, but didn't recieve funds", 400)
			return
		}

		userID, err := strconv.ParseInt(rawUserID, 10, 64)
		if err != nil {
			h.logger.Error("user completed payment, but didn't recieve funds", "metadata", resource)
			http.Error(w, "user completed payment, but didn't recieve funds", 400)
			return
		}

		rawAmount := event["resource"].(map[string]interface{})["amount"].(map[string]interface{})["value"].(string)
		amount, err := strconv.ParseFloat(rawAmount, 64)
		if err != nil {
			h.logger.Error("user completed payment, but didn't recieve funds", "metadata", resource)
			http.Error(w, "user completed payment, but didn't recieve funds", 400)
			return
		}

		err = h.service.PaymentService.Deposit(r.Context(), userID, amount)
		if err != nil {
			h.logger.Error("user completed payment, but didn't recieve funds", "metadata", resource)
			http.Error(w, "user completed payment, but didn't recieve funds", 400)
			return
		}

		w.WriteHeader(http.StatusOK)
	default:
		// This practically never happens, our wehook only sends
		// successfully captured payments
		fmt.Println("📦 Unhandled event:", eventType)
	}

	w.WriteHeader(http.StatusOK)
}

// Helper function for consistent JSON responses
func jsonResponse(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Error("Error encoding JSON response:", err)
	}
}
