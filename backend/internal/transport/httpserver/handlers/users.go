package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

func (s *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := s.service.UserService.GetAllUsers()
	if err != nil {
		s.logger.Error("failed to get users", slog.Any("error", err))
		http.Error(w, "Internal server error, Please message administrators", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		s.logger.Error("error encoding users JSON", slog.Any("error", err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}


func (s *Handler) AllBookings(w http.ResponseWriter, r *http.Request) {
	bookings, err := s.service.BookingService.GetAllBookings()
	if err != nil {
		s.logger.Error("error fetching all bookings", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		s.logger.Error("error encoding all bookings JSON", slog.Any("error", err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func (s *Handler) FinishedBookings(w http.ResponseWriter, r *http.Request) {
	bookings, err := s.service.BookingService.GetFinishedBookings()
	if err != nil {
		s.logger.Error("error fetching finished bookings", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		s.logger.Error("error encoding finished bookings JSON", slog.Any("error", err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
