package handlers

import (
	"encoding/json"
	"errors"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/views"
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

// @Summary		Delete a user
// @Description	Deletes a user with the given ID.
// @Tags			Users
// @Security BearerAuth
// @Param			id	path		int64	true	"User ID"
// @Success		204
// @Failure		400	{object}	views.HTTPError	"Invalid user ID"
// @Failure		404	{object}	views.HTTPError	"User not found"
// @Failure		500	{object}	views.HTTPError	"Internal server error"
// @Router			/api/users/{id} [delete]
func (s *Handler) HandleUserDelete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	userID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	err = s.service.UserService.Delete(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrUserNotFound):
			views.WriteError(w, http.StatusNotFound, err)
			return
		case errors.Is(err, entities.ErrZeroID), errors.Is(err, entities.ErrNegativeID):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrInsufficientPriv):
			views.WriteError(w, http.StatusForbidden, err)
			return
		case errors.Is(err, entities.ErrUnhandledError):
			views.WriteError(w, http.StatusInternalServerError, err)
			return
		default:
			slog.Error("error deleting user", slog.Any("error", err))
			views.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "unhandled error, please contact administrator."})
			return
		}

	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary      Fill user balance
// @Description  Adds a specified amount to the user's balance using their ID.
// @Tags         Users
// @Security     BearerAuth
// @Param        id      path    int64   true  "User ID"
// @Param        amount  query   float64 true  "Amount to add to user's balance"
// @Success      204
// @Failure      400     {object} views.HTTPError "Invalid user ID or balance"
// @Failure      404     {object} views.HTTPError "User not found"
// @Failure      500     {object} views.HTTPError "Internal server error"
// @Router       /api/users/{id}/credit [post]
func (s *Handler) HandleUserCredit(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("id")

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	balanceStr := r.URL.Query().Get("amount")

	balance, err := strconv.ParseFloat(balanceStr, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericAmount)
		return
	}

	err = s.service.UserService.CreditUserBalance(r.Context(), userID, balance)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrUserNotFound):
			views.WriteError(w, http.StatusNotFound, err)
			return
		case errors.Is(err, entities.ErrZeroID), errors.Is(err, entities.ErrNegativeID):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrNegativeOrZeroAmount):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrUserMaxBalance):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrUnhandledError):
			views.WriteError(w, http.StatusInternalServerError, err)
			return
		case errors.Is(err, entities.ErrUserMaxBalance):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrMaximumAmount):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrCreditInsufficientPriviliges):
			views.WriteError(w, http.StatusForbidden, err)
			return
		default:
			slog.Error("error filling user balance", slog.String("userID", userIDStr), slog.String("balance", balanceStr), slog.Any("error", err))
			views.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "unhandled error, please contact administrator."})
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Description  Grants a role (admin, analyst, etc.) to a user with the given ID. Only users with "owner" or "manager" roles can perform this action.
// @Tags         Users
// @Security     BearerAuth
// @Param        id    path     int64   true   "User ID"
// @Param        role  query    string  true   "Role to grant" Enums(manager,admin, analyst, client)
// @Success      204   "Role granted successfully"
// @Failure      400   {object}  views.HTTPError  "Invalid user ID or input"
// @Failure      404   {object}  views.HTTPError  "User not found"
// @Failure      500   {object}  views.HTTPError  "Internal server error"
// @Router       /api/users/{id}/grant [post]
func (s *Handler) HandleGrant(w http.ResponseWriter, r *http.Request) {
	// Id of user who we need to grant role
	idStr := r.PathValue("id")
	userID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	// Role to grant
	grantRole := r.URL.Query().Get("role")

	_, err = s.service.UserService.Grant(r.Context(), userID, grantRole)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrUserNotFound):
			views.WriteError(w, http.StatusNotFound, err)
			return
		case errors.Is(err, entities.ErrZeroID), errors.Is(err, entities.ErrNegativeID):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrUnhandledError):
			views.WriteError(w, http.StatusInternalServerError, err)
			return
		case errors.Is(err, entities.ErrGrantInsufficientPriviliges) ||
			errors.Is(err, entities.ErrGrantOwner) ||
			errors.Is(err, entities.ErrGrantSameRole) ||
			errors.Is(err, entities.ErrIncorrectRole) ||
			errors.Is(err, entities.ErrGrantEmptyRole):

			views.WriteError(w, http.StatusBadRequest, err)
			return
		default:
			slog.Error("error granting admin to user", slog.Int64("userID", userID), slog.Any("error", err))
			views.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "unhandled error, please contact administrator."})
			return
		}
	}
}
