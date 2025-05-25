package handlers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
)

// @Summary      Make a deposit
// @Description  Deposits funds to user's account via PayPal
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        request body     dto.DepositRequest  true  "Deposit request"
// @Success      200    {object}  dto.JSONAnswer      "Deposit successful"
// @Failure      400    {object}  dto.JSONAnswer      "Invalid request"
// @Failure      500    {object}  dto.JSONAnswer      "Internal server error"
// @Router       /api/payments/deposit [post]
func (s *Handler) handleDeposit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dto.DepositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Error decoding deposit request:", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if _, err := s.service.PaymentService.Deposit(r.Context(), req.UserID, req.Amount); err != nil {
		slog.Error("Error processing deposit:", "error", err)

		var status int
		switch {
		case errors.Is(err, entities.ErrPaymentFailed):
			status = http.StatusPaymentRequired
		case errors.Is(err, entities.ErrPaymentCanceled):
			status = http.StatusBadRequest
		case errors.Is(err, entities.ErrPaymentTimeout):
			status = http.StatusGatewayTimeout
		default:
			status = http.StatusInternalServerError
		}

		jsonResponse(w, status, dto.JSONAnswer{
			Message: "Fail",
		})
		return
	}

	jsonResponse(w, http.StatusOK, dto.JSONAnswer{
		Message: "Success",
	})
}

// @Summary      Pay for booking
// @Description  Pays for a booking using user's balance
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        request body     dto.BookingPaymentRequest  true  "Booking payment request"
// @Success      200    {object}  dto.JSONAnswer             "Payment successful"
// @Failure      400    {object}  dto.JSONAnswer             "Invalid request"
// @Failure      402    {object}  dto.JSONAnswer             "Insufficient funds"
// @Failure      404    {object}  dto.JSONAnswer             "Booking not found"
// @Failure      500    {object}  dto.JSONAnswer             "Internal server error"
// @Router       /api/payments/bookings [post]
func (s *Handler) handleBookingPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dto.BookingPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Error decoding booking payment request:", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if err := s.service.PaymentService.PayBooking(r.Context(), req.BookingID); err != nil {
		slog.Error("Error processing booking payment:", err)

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
// @Description  Cancels a booking and refunds the payment
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Param        id  path      int64           true  "Booking ID"
// @Success      200 {object}  dto.JSONAnswer  "Refund successful"
// @Failure      400 {object}  dto.JSONAnswer  "Invalid booking ID"
// @Failure      404 {object}  dto.JSONAnswer  "Booking not found"
// @Failure      500 {object}  dto.JSONAnswer  "Internal server error"
// @Router       /api/payments/bookings/{id} [delete]
func (s *Handler) handleBookingRefund(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		w.Header().Set("Allow", "DELETE")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	bookingID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		slog.Error("Error parsing booking ID:", err)
		http.Error(w, "Invalid booking ID", http.StatusBadRequest)
		return
	}

	if err := s.service.PaymentService.CancelBooking(r.Context(), bookingID); err != nil {
		slog.Error("Error processing booking refund:", err)
		http.Error(w, "Refund failed", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, dto.JSONAnswer{
		Message: "Refund successful",
	})
}

func (s *Handler) HandlePayments(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	switch {
	case path == "/api/payments/deposit":
		s.handleDeposit(w, r)
	case path == "/api/payments/bookings":
		s.handleBookingPayment(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (s *Handler) HandleBookingPayments(w http.ResponseWriter, r *http.Request) {
	s.handleBookingRefund(w, r)
}

// Helper function for consistent JSON responses
func jsonResponse(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Error("Error encoding JSON response:", err)
	}
}
