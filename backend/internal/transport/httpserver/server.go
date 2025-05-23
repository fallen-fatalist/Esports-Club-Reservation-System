package httpserver

import (
	"log/slog"
	"net/http"
	"time"

	"esports_club_booking/internal/transport/httpserver/middleware"

	_ "esports_club_booking/docs"

	httpSwagger "github.com/swaggo/http-swagger"
)

type Server struct {
	handler http.Handler
	logger  *slog.Logger
	address string
}

func NewServer(handler http.Handler, logger *slog.Logger, adress string) *Server {
	return &Server{
		handler: handler,
		logger:  logger,
		address: adress,
	}
}

func (s *Server) Start() error {
	router := http.NewServeMux()
	// add prefix /api to all handlers and strip prefix right before it goes to mux
	router.Handle("/api/", http.StripPrefix("/api", s.handler))

	/* Swagger */
	router.HandleFunc("/api/docs/", httpSwagger.WrapHandler)

	/* Middlewares attach */
	RequestLoggerMW := middleware.NewRequestLoggerMW(s.logger)

	MWChain := middleware.NewMiddlewareChain(middleware.RecoverPanicMW, RequestLoggerMW)

	s.logger.Info("Starting server",
		slog.String("address", s.address),
		slog.Any("time", time.Now()),
	)

	return http.ListenAndServe(s.address, MWChain(router))
}
