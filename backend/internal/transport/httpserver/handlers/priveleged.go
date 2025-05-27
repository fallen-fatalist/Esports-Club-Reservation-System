package handlers

import (
	"errors"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/utils"
	"log/slog"
	"net/http"
	"strconv"
)

// @Summary		Check if user is privileged
// @Description	Returns a 200 status if user is privileged
// @Tags			Auth
// @Security BearerAuth
// @Success		200
// @Router			/auth/priveleged [get]
func (s *Handler) IsPriveleged(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

// @Summary		Block a user
// @Description	Blocks a user with the given ID.
// @Tags			Users
// @Security BearerAuth
// @Param			id	path		int64				true	"User ID"
// @Success		204
// @Failure		400	{object}	utils.HTTPError	"Invalid user ID"
// @Failure		401	{object}	utils.HTTPError	"Unauthorized"
// @Failure		500	{object}	utils.HTTPError	"Internal server error"
// @Router			/api/users/{id}/block [post]
func (s *Handler) HandleBlock(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("id")

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	err = s.service.UserService.Block(userID)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrNegativeID),
			errors.Is(err, entities.ErrZeroID),
			errors.Is(err, entities.ErrUserNotFound):
			utils.WriteError(w, http.StatusBadRequest, err)
			return
		default:
			slog.Error("unhandled error while blocking user:", slog.Any("error", err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)

}

// @Summary		Unblock a user
// @Description	Unblocks a user with the given ID.
// @Tags			Users
// @Security BearerAuth
// @Param			id	path		int64				true	"User ID"
// @Success		204
// @Failure		400	{object}	utils.HTTPError	"Invalid user ID"
// @Failure		401	{object}	utils.HTTPError	"Unauthorized"
// @Failure		500	{object}	utils.HTTPError	"Internal server error"
// @Router			/api/users/{id}/unblock [post]
func (s *Handler) HandleUnblock(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("id")

	if userIDStr == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	err = s.service.UserService.Unblock(userID)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrNegativeID),
			errors.Is(err, entities.ErrZeroID),
			errors.Is(err, entities.ErrUserNotFound):
			utils.WriteError(w, http.StatusBadRequest, err)
			return
		default:
			slog.Error("unhandled error while unblocking user:", slog.Any("error", err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}
