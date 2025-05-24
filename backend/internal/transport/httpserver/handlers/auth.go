package handlers

import (
	"encoding/json"
	"errors"
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/utils"
	"fmt"
	"log/slog"
	"net/http"
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
func (s *Handler) HandleRegistration(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		s.register(w, r)
	default:
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Handler) register(w http.ResponseWriter, r *http.Request) {
	var userPayload dto.RegisterUser
	if err := utils.ParseJSON(r, &userPayload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	fmt.Println("here shit happens")
	// if userPayload.Email == "" {
	// 	utils.WriteError(w, http.StatusBadRequest, errors.New("empty email"))
	// 	return
	// }
	// if userPayload.Login == "" {
	// 	utils.WriteError(w, http.StatusBadRequest, errors.New("empty login"))
	// 	return
	// }
	// if userPayload.Password == "" {
	// 	utils.WriteError(w, http.StatusBadRequest, errors.New("empty password"))
	// 	return
	// }

	userId, err := s.service.UserService.Register(userPayload)
	if err != nil {
		if errors.Is(err, service.ErrUserAlreadyExists) {
			utils.WriteError(w, http.StatusConflict, errors.New("user with this email or login already exists"))
			return
		}
		s.logger.Error("failed to create user", slog.Any("error", err))
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to register user"))
		return
	}

	s.logger.Info("successfully registered user", slog.Int64("user_id", userId))
	utils.WriteJSON(w, http.StatusCreated, utils.Message{Message: "user created successfully"})
}

// @Summary		User login
// @Description	Login user with email, login and password, returns JWT token
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			credentials	body		dto.LoginUser		true	"Login credentials"
// @Success		200			{object}	dto.TokenResponse	"JWT token"
// @Failure		400			{object}	utils.HTTPError		"Bad request, validation error"
// @Failure		401			{object}	utils.HTTPError		"Unauthorized, invalid credentials or blocked user"
// @Router			/auth/sign-in [post]
func (s *Handler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		s.login(w, r)
	default:
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Handler) login(w http.ResponseWriter, r *http.Request) {
	var userPayload dto.LoginUser
	if err := utils.ParseJSON(r, &userPayload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	token, err := s.service.UserService.Login(userPayload)
	if err != nil {
		if errors.Is(err, service.ErrUserBlockedOrUnverified) {
			s.logger.Warn("failed login attempt", slog.Any("error", err))
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("failed to login: %s", "user is unverified or blocked"))
			return
		}
		if errors.Is(err, service.ErrInvalidCredentials) {
			s.logger.Warn("failed login attempt", slog.Any("error", err))
			utils.WriteError(w, http.StatusUnauthorized, errors.New("invalid email or password"))
			return
		}
		s.logger.Warn("failed login attempt", slog.Any("error", err))
		utils.WriteError(w, http.StatusUnauthorized, errors.New("failed to login"))
		return
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
// @Param			verificationRequest	body		dto.VerificationRequest	true	"Verification code request"
// @Success		200					{object}	JSONAnswer				"Verification code sent"
// @Failure		400					{object}	utils.HTTPError			"Invalid request"
// @Failure		500					{object}	utils.HTTPError			"Internal server error"
// @Router			/auth/activate [post]
func (h *Handler) HandleRequestCode(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.requestCode(w, r)
	default:
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) requestCode(w http.ResponseWriter, r *http.Request) {
	var req dto.VerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if err := h.service.UserService.SendVerificationCode(req); err != nil {
		if errors.Is(err, service.ErrSentCodeAlready) {
			http.Error(w, "code already sent,wait for new attempt", http.StatusBadRequest)
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
func (h *Handler) HandleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.verifyEmail(w, r)
	default:
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) verifyEmail(w http.ResponseWriter, r *http.Request) {
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
