package handlers

import (
	"encoding/json"
	"errors"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/utils"
	"log/slog"
	"net/http"
	"strconv"
)

// @Summary		Get all users
// @Description	Returns a list of all users
// @Tags			Users
// @Security BearerAuth
// @Produce		json
// @Success		200	{array}		entities.User	"List of users"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/users [get]
func (s *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := s.service.UserService.GetUsers()
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

// @Summary		Get all bookings
// @Description	Returns a list of all bookings
// @Tags			Bookings
// @Security BearerAuth
// @Produce		json
// @Success		200	{array}		entities.Booking	"List of all bookings"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/bookings/all [get]
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

// @Summary		Delete a user
// @Description	Deletes a user with the given ID.
// @Tags			Users
// @Security BearerAuth
// @Param			id	path		int64	true	"User ID"
// @Success		204
// @Failure		400	{object}	utils.HTTPError	"Invalid user ID"
// @Failure		404	{object}	utils.HTTPError	"User not found"
// @Failure		500	{object}	utils.HTTPError	"Internal server error"
// @Router			/api/users/{id} [delete]
func (s *Handler) HandleUserDelete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	userID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	err = s.service.UserService.Delete(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrUserNotFound):
			utils.WriteError(w, http.StatusNotFound, err)
			return
		case errors.Is(err, entities.ErrZeroID), errors.Is(err, entities.ErrNegativeID):
			utils.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrInsufficientPriv):
			utils.WriteError(w, http.StatusForbidden, err)
			return
		case errors.Is(err, entities.ErrUnhandledError):
			utils.WriteError(w, http.StatusInternalServerError, err)
			return
		default:
			slog.Error("error deleting user", slog.Any("error", err))
			utils.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "unhandled error, please contact administrator."})
			return
		}

	}

	w.WriteHeader(http.StatusNoContent)
}
