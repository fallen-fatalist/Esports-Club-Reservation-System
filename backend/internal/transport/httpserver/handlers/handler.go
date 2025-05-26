package handlers

import (
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/service"
	"log/slog"
	"net/http"
)

type Handler struct {
	service *service.Service
	logger  *slog.Logger
	jwtMng  auth.JWTManager
}

func NewHandler(svc *service.Service, logger *slog.Logger, jwtMng auth.JWTManager) *Handler {
	return &Handler{service: svc, logger: logger, jwtMng: jwtMng}
}

func (h *Handler) RegisterEndpoints(mux *http.ServeMux) {

	/* Priveleged endpoints */
	mux.HandleFunc("GET /priveleged", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.IsPriveleged))

	/* Computers */
	mux.HandleFunc("/computers", h.HandleComputers)
	mux.HandleFunc("/computers/{id}", h.HandleComputer)
	mux.HandleFunc("/computers/status", h.HandleComputerStatuses)
	mux.HandleFunc("/computers/{id}/status", h.HandleComputerStatus)

	/* Packages */
	mux.HandleFunc("GET /packages", h.Packages)

	/* Bookings */
	mux.HandleFunc("GET /bookings", h.Bookings)
	mux.HandleFunc("POST /bookings", auth.WithAuth(h.jwtMng, entities.AllRoles, h.PostBooking))
	mux.HandleFunc("/bookings", h.BookingsOptions)

	mux.HandleFunc("/bookings/pending", auth.WithAuth(h.jwtMng, entities.AllRoles, h.HandlePendingBookings))
	mux.HandleFunc("/bookings/active", auth.WithAuth(h.jwtMng, entities.AllRoles, h.HandleActiveBookings))
	mux.HandleFunc("/bookings/finished", auth.WithAuth(h.jwtMng, entities.AllRoles, h.HandleFinishedBookings))
	mux.HandleFunc("/bookings/cancelled", auth.WithAuth(h.jwtMng, entities.AllRoles, h.HandleCancelledBookings))
	mux.HandleFunc("GET /computers/{id}/bookings", h.ComputerBookings)
	mux.HandleFunc("GET /users/bookings", auth.WithAuth(h.jwtMng, entities.AllRoles, h.UserBookings))
	mux.HandleFunc("POST /bookings/{id}/cancel", auth.WithAuth(h.jwtMng, entities.AllRoles, h.HandleCancel))

	mux.HandleFunc("/computers/remaining", h.ComputersRemaining)
	mux.HandleFunc("/computers/{id}/remaining", h.HandleComputerRemaining)

	mux.HandleFunc("GET /users", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.GetUsers))

	//User & Auth
	mux.HandleFunc("/auth/sign-up", h.HandleRegistration)
	mux.HandleFunc("/auth/sign-in", h.HandleLogin)
	mux.HandleFunc("/auth/activate", h.HandleRequestCode)
	mux.HandleFunc("/auth/verify", h.HandleVerifyEmail)

	// TODO: Possibility to spam without AUTH token, need different endpoints with call timeouts
	mux.HandleFunc("/auth/reset/request", h.HandleRequestPasswordResetCode)
	mux.HandleFunc("/auth/reset/confirm", h.HandleResetPassword)

	mux.HandleFunc("GET /auth/authorized", auth.WithAuth(h.jwtMng, entities.AllRoles, h.IsAuthorized))
	mux.HandleFunc("POST /auth/logout", auth.WithAuth(h.jwtMng, entities.AllRoles, h.Logout))

}

type JSONAnswer struct {
	Message string `json:"message"`
	ID      int64  `json:"id,omitempty"`
}
