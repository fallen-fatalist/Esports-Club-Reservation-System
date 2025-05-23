package handlers

import (
	"log/slog"
	"net/http"

	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/service"
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

	/* Packages */
	mux.HandleFunc("GET /packages", h.Packages)

	/* Bookings */
	mux.HandleFunc("GET /bookings", h.Bookings)
	mux.HandleFunc("POST /bookings", auth.WithAuth(h.jwtMng, allRoles, h.PostBooking))
	mux.HandleFunc("/bookings", h.BookingsOptions)

	mux.HandleFunc("/bookings/pending", auth.WithAuth(h.jwtMng, allRoles, h.HandlePendingBookings))
	mux.HandleFunc("/bookings/active", auth.WithAuth(h.jwtMng, allRoles, h.HandleActiveBookings))
	mux.HandleFunc("/bookings/finished", auth.WithAuth(h.jwtMng, allRoles, h.HandleFinishedBookings))
	mux.HandleFunc("/bookings/cancelled", auth.WithAuth(h.jwtMng, allRoles, h.HandleCancelledBookings))
	mux.HandleFunc("GET /computers/{id}/bookings", h.ComputerBookings)
	mux.HandleFunc("GET /users/bookings", auth.WithAuth(h.jwtMng, allRoles, h.UserBookings))

	mux.HandleFunc("/computers/remaining", h.ComputersRemaining)
	mux.HandleFunc("/computers/{id}/remaining", h.HandleComputerRemaining)

	// mux.HandleFunc("/api/users", s.GetUsers)
	// mux.Handle("/api/packages", s.GetAllPackages)
	// mux.Handle("/api/bookings/pending", http.HandlerFunc(PendingBookings))
	// mux.Handle("/api/bookings/finished", http.HandlerFunc(FinishedBookings))

	// User & Auth
	mux.HandleFunc("/auth/sign-up", h.HandleRegistration)
	mux.HandleFunc("/auth/sign-in", h.HandleLogin)
	mux.HandleFunc("/auth/activate", h.HandleRequestCode)
	mux.HandleFunc("/auth/verify", h.HandleVerifyEmail)
}

type JSONAnswer struct {
	Message string `json:"message"`
	ID      int64  `json:"id,omitempty"`
}
