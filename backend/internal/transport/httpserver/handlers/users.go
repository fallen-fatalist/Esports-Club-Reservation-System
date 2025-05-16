package handlers

import (
	"encoding/json"
	"errors"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/utils"
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

func (s *Handler) Packages(w http.ResponseWriter, r *http.Request) {
	packages, err := s.service.PackageService.GetAllPackages()
	if err != nil {
		s.logger.Error("error fetching packages", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(packages); err != nil {
		s.logger.Error("error encoding packages JSON", slog.Any("error", err))
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

	if userPayload.Email == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("empty email"))
		return
	}
	if userPayload.Login == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("empty login"))
		return
	}
	if userPayload.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("empty password"))
		return
	}

	userId, err := s.service.UserService.Register(userPayload)
	if err != nil {
		if errors.Is(err, service.ErrUserAlreadyExists) {
			utils.WriteError(w, http.StatusConflict, errors.New("user with this email already exists"))
			return
		}
		s.logger.Error("failed to create user", slog.Any("error", err))
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to register user"))
		return
	}

	s.logger.Info("successfully registered user", slog.Int64("user_id", userId))
	utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "user created successfully"})
}

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

	if userPayload.Login == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("empty login"))
		return
	}
	if userPayload.Email == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("empty email"))
		return
	}
	if userPayload.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("empty password"))
		return
	}

	token, err := s.service.UserService.Login(userPayload)
	if err != nil {
		s.logger.Warn("failed login attempt", slog.Any("error", err))
		utils.WriteError(w, http.StatusUnauthorized, errors.New("failed to login"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"token": token})
}
