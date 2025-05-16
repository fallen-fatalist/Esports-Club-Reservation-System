package handlers

import (
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/service"
	"log/slog"
	"net/http"
)

var allRoles []string = []string{"client", "admin", "analyst", "manager"}

type Handler struct {
	service *service.Service
	logger  *slog.Logger
	jwtMng  auth.JWTManager
}

func NewHandler(svc *service.Service, logger *slog.Logger, jwtMng auth.JWTManager) *Handler {
	return &Handler{service: svc, logger: logger, jwtMng: jwtMng}
}

func (h *Handler) RegisterEndpoints(mux *http.ServeMux) {
	/* Computers */
	mux.HandleFunc("/computers", h.HandleComputers)
	mux.HandleFunc("/computers/{id}", h.HandleComputer)
	mux.HandleFunc("/computers/status", h.HandleComputerStatuses)
	mux.HandleFunc("/computers/{id}/status", h.HandleComputerStatus)

	/* Bookings */
	mux.HandleFunc("/bookings/{id}", h.HandleComputerBookings)
	mux.HandleFunc("/bookings", h.HandleBookings)
	mux.HandleFunc("/bookings/pending", h.HandlePendingBookings)
	mux.HandleFunc("/bookings/active", h.HandleActiveBookings)
	mux.HandleFunc("/bookings/finished", h.HandleFinishedBookings)
	mux.HandleFunc("/bookings/cancelled", h.HandleCancelledBookings)
	mux.HandleFunc("/bookings/left", h.HandleComputersLeftTime)
	mux.HandleFunc("/bookings/{id}/left", h.HandleComputerLeftTime)

	//mux.HandleFunc("/api/users", s.GetUsers)
	// mux.Handle("/api/packages", s.GetAllPackages)
	// mux.Handle("/api/bookings/pending", http.HandlerFunc(PendingBookings))
	// mux.Handle("/api/bookings/finished", http.HandlerFunc(FinishedBookings))

	//User & Auth
	mux.HandleFunc("/register", h.HandleRegistration)
	mux.HandleFunc("/login", h.HandleLogin)
}

type JSONAnswer struct {
	Message string `json:"message"`
	ID      int64  `json:"id,omitempty"`
}
