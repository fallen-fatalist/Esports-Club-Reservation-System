package handlers

import (
	"esports_club_booking/internal/entities"
	"log/slog"
	"net/http"

	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/service"
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

	/* Computers */

	mux.HandleFunc("GET /computers", h.Computers)
	mux.HandleFunc("POST /computers", auth.WithAuth(h.jwtMng, entities.ManagementRoles, h.PostComputers))
	mux.HandleFunc("GET /computers/remaining", h.ComputersRemaining)
	mux.HandleFunc("GET /computers/status", h.HandleComputerStatuses)
	mux.HandleFunc("GET /computers/{id}/remaining", h.HandleComputerRemaining)
	mux.HandleFunc("GET /computers/{id}/status", h.HandleComputerStatus)
	mux.HandleFunc("GET /computers/{id}", h.Computer)
	mux.HandleFunc("DELETE /computers/{id}", auth.WithAuth(h.jwtMng, entities.ManagementRoles, h.DeleteComputer))

	/* Packages */
	mux.HandleFunc("GET /packages", h.Packages)

	/* Bookings */
	mux.HandleFunc("GET /bookings", h.Bookings)
	mux.HandleFunc("POST /bookings", auth.WithAuth(h.jwtMng, entities.AllRoles, h.PostBooking))

	mux.HandleFunc("GET /computers/{id}/bookings", h.ComputerBookings)
	mux.HandleFunc("POST /bookings/{id}/cancel", auth.WithAuth(h.jwtMng, entities.AllRoles, h.HandleCancel))

	/* User  */
	mux.HandleFunc("GET /users", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.GetUsers))
	mux.HandleFunc("GET /users/bookings", auth.WithAuth(h.jwtMng, entities.AllRoles, h.UserBookings))
	mux.HandleFunc("POST /users/{id}/block", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.HandleBlock))
	mux.HandleFunc("POST /users/{id}/unblock", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.HandleUnblock))
	mux.HandleFunc("POST /users/{id}/credit", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.HandleUserCredit))
	mux.HandleFunc("POST /users/{id}/admin", auth.WithAuth(h.jwtMng, entities.ManagementRoles, h.HandleGrantAdmin))
	mux.HandleFunc("DELETE /users/{id}", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.HandleUserDelete))
	mux.HandleFunc("POST /users/upload_pfp", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.))


	//Auth
	mux.HandleFunc("POST /auth/sign-up", h.Register)
	mux.HandleFunc("POST /auth/sign-in", h.Login)
	mux.HandleFunc("POST /auth/activate", h.RequestCode)
	mux.HandleFunc("POST /auth/verify", h.VerifyEmail)

	// TODO: Possibility to spam without AUTH token, need different endpoints with call timeouts
	mux.HandleFunc("/auth/reset/request", h.HandleRequestPasswordResetCode)
	mux.HandleFunc("/auth/reset/confirm", h.HandleResetPassword)

	// Payment
	mux.HandleFunc("POST /payment/deposit", auth.WithAuth(h.jwtMng, entities.AllRoles, h.handleDeposit))
	mux.HandleFunc("POST /payment/booking", auth.WithAuth(h.jwtMng, entities.AllRoles, h.handleBookingPayment))
	mux.HandleFunc("POST /payment/cancel", auth.WithAuth(h.jwtMng, entities.AllRoles, h.handleBookingRefund))
	mux.HandleFunc("POST /payment/webhook", h.handleWebhook)

	mux.HandleFunc("GET /auth/authorized", auth.WithAuth(h.jwtMng, entities.AllRoles, h.IsAuthorized))
	mux.HandleFunc("POST /auth/logout", auth.WithAuth(h.jwtMng, entities.AllRoles, h.Logout))
	mux.HandleFunc("GET /auth/priveleged", auth.WithAuth(h.jwtMng, entities.PrivellegedRoles, h.IsPriveleged))
}

type JSONAnswer struct {
	Message string `json:"message"`
	ID      int64  `json:"id,omitempty"`
}
