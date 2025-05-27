package handlers

import (
	"encoding/json"
	"errors"
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/service"
	authService "esports_club_booking/internal/service/implementation"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/utils"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"
)

// @Summary		Register a new user
// @Description	Registers a user with email, login and password
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			user	body		dto.RegisterUser	true	"User registration data"
// @Success		201		{object}	utils.Message	"User created successfully"
// @Failure		400		{object}	utils.HTTPError		"Bad request, validation error"
// @Failure		409		{object}	utils.HTTPError		"User already exists"
// @Failure		500		{object}	utils.HTTPError		"Internal server error"
// @Router			/auth/sign-up [post]
func (s *Handler) Register(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("jwt_token")
	if err == nil {
		_, err := s.jwtMng.ValidateToken(cookie.Value)
		if err == nil {
			utils.WriteError(w, http.StatusConflict, entities.ErrAlreadyAuthenticated)
			return
		} else {
			s.Logout(w, r)
		}
	}

	var userPayload dto.RegisterUser
	if err := utils.ParseJSON(r, &userPayload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	_, err = s.service.UserService.Register(userPayload)

	if err != nil {
		switch {
		case errors.Is(err, entities.ErrInvalidUserID),
			errors.Is(err, entities.ErrNegativeComputerID),
			errors.Is(err, entities.ErrInvalidPackageZero),
			errors.Is(err, entities.ErrInvalidPackageNegative),
			errors.Is(err, entities.ErrInvalidStartTimeFormat),
			errors.Is(err, entities.ErrInvalidEndTimeFormat),
			errors.Is(err, entities.ErrStartTimeInPast),
			errors.Is(err, entities.ErrEndBeforeStart),
			errors.Is(err, entities.ErrNonHourlyDuration),
			errors.Is(err, entities.ErrEmptyStatus),
			errors.Is(err, entities.ErrInvalidStatus),
			errors.Is(err, authService.ErrUsernameEmpty),
			errors.Is(err, authService.ErrUsernameLength),
			errors.Is(err, authService.ErrUsernameWhitespace),
			errors.Is(err, authService.ErrUsernameStartLetter),
			errors.Is(err, authService.ErrUsernameInvalidCharacters),
			errors.Is(err, authService.ErrUsernameConsecutiveSpecials),
			errors.Is(err, authService.ErrUsernameEndsWithSpecial),
			errors.Is(err, authService.ErrEmailEmpty),
			errors.Is(err, authService.ErrEmailWhitespace),
			errors.Is(err, authService.ErrEmailInvalidFormat),
			errors.Is(err, authService.ErrPasswordEmpty),
			errors.Is(err, authService.ErrPasswordTooShort),
			errors.Is(err, authService.ErrPasswordWhitespace),
			errors.Is(err, authService.ErrPasswordMissingLowercase),
			errors.Is(err, authService.ErrPasswordMissingUppercase),
			errors.Is(err, authService.ErrPasswordMissingDigit),
			errors.Is(err, authService.ErrPasswordMissingSpecial):
			utils.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, service.ErrUserAlreadyExists):
			utils.WriteError(w, http.StatusConflict, errors.New("user with this email or login already exists"))
			return
		default:
			s.logger.Error("failed to create user", slog.Any("error", err))
			utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to register user"))
			return
		}
	}

	utils.WriteJSON(w, http.StatusCreated, utils.Message{Message: "user created successfully"})
}

// @Summary		User login
// @Description	Login user with email, login and password, returns JWT token
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			credentials	body		dto.LoginUser		true	"Login credentials"
// @Success		204			"No Content, JWT set in HTTPOnly cookie"
// @Failure		400			{object}	utils.HTTPError		"Bad request, validation error"
// @Failure		401			{object}	utils.HTTPError		"Unauthorized, invalid credentials or blocked user"
// @Router			/auth/sign-in [post]
func (s *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var userPayload dto.LoginUser
	if err := utils.ParseJSON(r, &userPayload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	token, err := s.service.UserService.Login(userPayload)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserBlockedOrUnverified):
			s.logger.Warn("failed login attempt", slog.Any("error", err))
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("failed to login: %s", "user is unverified or blocked"))
			return

		case errors.Is(err, service.ErrInvalidCredentials):
			s.logger.Warn("failed login attempt", slog.Any("error", err))
			utils.WriteError(w, http.StatusUnauthorized, errors.New("invalid email or password"))
			return
		case errors.Is(err, entities.ErrUserBlocked):
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		default:
			s.logger.Warn("failed login attempt", slog.Any("error", err))
			utils.WriteError(w, http.StatusUnauthorized, errors.New("failed to login"))
			return
		}
	}

	exp, err := auth.ExtractExpiration(token)
	if err != nil {
		exp = time.Time{}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt_token",
		Value:    token,
		Expires:  exp,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	// utils.WriteJSON(w, http.StatusOK, dto.TokenResponse{Token: token})
}

// @Summary		Send verification code to user's email
// @Description	Sends a verification code to the email provided in request body
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			verificationRequest	body		dto.EmailVerificationRequest	true	"Verification code request"
// @Success		200					{object}	JSONAnswer				"Verification code sent"
// @Failure		400					{object}	utils.HTTPError			"Invalid request"
// @Failure		500					{object}	utils.HTTPError			"Internal server error"
// @Router			/auth/activate [post]
func (h *Handler) RequestCode(w http.ResponseWriter, r *http.Request) {
	var req dto.EmailVerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if err := h.service.UserService.SendVerificationCode(req); err != nil {
		if errors.Is(err, service.ErrSentCodeAlready) {
			utils.WriteJSON(w, http.StatusTooManyRequests, "code already sent,wait for new attempt")
			return
		}
		h.logger.Error("failed to send verification code", slog.Any("error", err))
		http.Error(w, "failed to send code", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, JSONAnswer{Message: "verification code sent"})
}

// @Summary		Verify email with code
// @Description	Verifies user's email using a verification code
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			verifyEmailRequest	body		dto.VerifyEmailRequest	true	"Email verification request"
// @Success		200					{object}	JSONAnswer				"Email verified successfully"
// @Failure		400					{object}	utils.HTTPError			"Invalid request or verification error"
// @Failure		404					{object}	utils.HTTPError			"User not found"
// @Failure		429					{object}	utils.HTTPError			"Too many attempts"
// @Failure		500					{object}	utils.HTTPError			"Internal server error"
// @Router			/auth/verify [post]
func (h *Handler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req dto.VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	err := h.service.UserService.VerifyEmail(req)
	switch {
	case err == nil:
		utils.WriteJSON(w, http.StatusOK, JSONAnswer{Message: "email verified"})
		return
	case errors.Is(err, service.ErrNoNeedVerification):
		h.logger.Warn("verification not needed", slog.Any("error", err))
		http.Error(w, "user didn't request code or doesn't need verification", http.StatusBadRequest)
		return
	case errors.Is(err, service.ErrInvalidVerificationCode):
		h.logger.Warn("invalid or expired code", slog.Any("error", err))
		http.Error(w, "invalid or expired code", http.StatusBadRequest)
		return
	case errors.Is(err, service.ErrTooManyAttempts):
		h.logger.Warn("too many attempts", slog.Any("error", err))
		http.Error(w, "too many attempts, try later", http.StatusTooManyRequests)
		return
	case errors.Is(err, service.ErrUserNotFound):
		h.logger.Warn("user not found", slog.Any("error", err))
		http.Error(w, "user not found", http.StatusNotFound)
		return
	default:
		h.logger.Error("internal error", slog.Any("error", err))
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
}

// @Summary		Check if user is authorized
// @Description	Returns the user's data if they are authorized
// @Tags			Auth
// @Security BearerAuth
// @Accept			json
// @Produce		json
// @Success		200		{object}	dto.User	"User authorized"
// @Router			/auth/authorized [get]
func (h *Handler) IsAuthorized(w http.ResponseWriter, r *http.Request) {
	token, err := r.Cookie("jwt_token")
	if err == nil {
		_, err = h.jwtMng.ValidateToken(token.Value)
		if err != nil {
			h.Logout(w, r)
			utils.WriteError(w, http.StatusUnauthorized, entities.ErrInvalidToken)
			return
		}
	}
	userIDStr, _ := auth.GetUserIDFromContext(r.Context())
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	// Lie to the client who is trying to brute force the token
	if err != nil {
		utils.WriteJSON(w, http.StatusUnauthorized, dto.JSONAnswer{Message: "missing token"})
		return
	}

	user, err := h.service.UserService.GetUser(userID)
	if err != nil {
		h.logger.Error("failed to get user", slog.Any("error", err))
		utils.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "internal error"})
		return
	}

	userDTO := dto.User{
		Username: user.Login,
		Email:    user.Email,
		Status:   user.Status,
		Role:     user.Role,
		Balance:  user.Balance,
	}

	utils.WriteJSON(w, http.StatusOK, userDTO)
}

// @Summary		Request password reset code
// @Description	Sends a password reset code to the user's email
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			resetRequest	body		dto.ResetPasswordRequest	true	"Password reset request"
// @Success		200				{object}	JSONAnswer					"Reset code sent"
// @Failure		400				{object}	utils.HTTPError				"Invalid request or user not found"
// @Failure		500				{object}	utils.HTTPError				"Internal server error"
// @Router			/auth/reset/request [post]
func (h *Handler) HandleRequestPasswordResetCode(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.requestPasswordResetCode(w, r)
	default:
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) requestPasswordResetCode(w http.ResponseWriter, r *http.Request) {
	var req dto.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.service.UserService.SendPasswordResetCode(req.Email); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.WriteError(w, http.StatusBadRequest, err)
			return
		} else if errors.Is(err, service.ErrPasswordRecentlyChanged) {
			utils.WriteError(w, http.StatusBadRequest, err)
			return
		}
		h.logger.Error("failed to send reset code", slog.Any("error", err))
		http.Error(w, "failed to send reset code", http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, JSONAnswer{Message: "reset code sent"})
}

// @Summary		Reset password
// @Description	Resets user's password using email, code and new password
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			resetConfirm	body		dto.ResetPasswordConfirm	true	"Password reset confirmation"
// @Success		200				{object}	JSONAnswer					"Password reset successfully"
// @Failure		400				{object}	utils.HTTPError				"Invalid request or verification code"
// @Failure		404				{object}	utils.HTTPError				"User not found"
// @Failure		429				{object}	utils.HTTPError				"Too many attempts"
// @Failure		500				{object}	utils.HTTPError				"Internal server error"
// @Failure		400				{object}	utils.HTTPError				"Password recently changed"
// @Failure		400				{object}	utils.HTTPError				"Invalid username or password"
// @Router			/auth/reset/confirm [post]
func (h *Handler) HandleResetPassword(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.resetPassword(w, r)
	default:
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) resetPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ResetPasswordConfirm
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	err := h.service.UserService.ConfirmPasswordReset(req)
	switch {
	case err == nil:
		h.Logout(w, r)
		utils.WriteJSON(w, http.StatusOK, JSONAnswer{Message: "password changed"})

	case errors.Is(err, service.ErrInvalidVerificationCode):
		utils.WriteError(w, http.StatusBadRequest, err)

	case errors.Is(err, service.ErrTooManyAttempts):
		utils.WriteError(w, http.StatusTooManyRequests, err)

	case errors.Is(err, service.ErrNoNeedVerification):
		utils.WriteError(w, http.StatusBadGateway, err)

	case errors.Is(err, service.ErrUserNotFound):
		utils.WriteError(w, http.StatusNotFound, err)

	case errors.Is(err, authService.ErrUsernameEmpty),
		errors.Is(err, authService.ErrUsernameLength),
		errors.Is(err, authService.ErrUsernameWhitespace),
		errors.Is(err, authService.ErrUsernameStartLetter),
		errors.Is(err, authService.ErrUsernameInvalidCharacters),
		errors.Is(err, authService.ErrUsernameConsecutiveSpecials),
		errors.Is(err, authService.ErrUsernameEndsWithSpecial),
		errors.Is(err, authService.ErrEmailEmpty),
		errors.Is(err, authService.ErrEmailWhitespace),
		errors.Is(err, authService.ErrEmailInvalidFormat),
		errors.Is(err, authService.ErrPasswordEmpty),
		errors.Is(err, authService.ErrPasswordTooShort),
		errors.Is(err, authService.ErrPasswordWhitespace),
		errors.Is(err, authService.ErrPasswordMissingLowercase),
		errors.Is(err, authService.ErrPasswordMissingUppercase),
		errors.Is(err, authService.ErrPasswordMissingDigit),
		errors.Is(err, authService.ErrPasswordMissingSpecial):
		utils.WriteError(w, http.StatusBadRequest, err)
		return

	default:
		h.logger.Error("internal error", slog.Any("error", err))
		utils.WriteJSON(w, http.StatusInternalServerError, JSONAnswer{Message: "internal error"})
	}
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
