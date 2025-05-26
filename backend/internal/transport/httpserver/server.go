package httpserver

import (
	"net/http"
	"strings"
	"time"

	"log/slog"

	"esports_club_booking/internal/config"
	"esports_club_booking/internal/transport/httpserver/middleware"

	_ "esports_club_booking/docs"

	httpSwagger "github.com/swaggo/http-swagger"
)

type Server struct {
	handler http.Handler
	logger  *slog.Logger
	config  config.Server
}

func NewServer(handler http.Handler, logger *slog.Logger, cfg config.Server) *Server {
	return &Server{
		handler: handler,
		logger:  logger,
		config:  cfg,
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

	/* CORS attach */
	CorsMW := middleware.NewCorsMW(s.config.CORS_ALLOWED)

	MWChain := middleware.NewMiddlewareChain(middleware.RecoverPanicMW, RequestLoggerMW, CorsMW)

	s.logger.Info("Starting server",
		slog.String("address", s.config.Address),
		slog.Any("time", time.Now()),
	)

	origins := make([]string, 0, len(s.config.CORS_ALLOWED))
	for origin := range s.config.CORS_ALLOWED {
		origins = append(origins, origin)
	}
	joinedOrigins := strings.Join(origins, ", ")
	s.logger.Info("The following origins allowed", slog.String("origins", joinedOrigins))

	return http.ListenAndServe(s.config.Address, MWChain(router))
}
