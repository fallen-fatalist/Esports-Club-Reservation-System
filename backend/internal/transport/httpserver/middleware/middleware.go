package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"time"
)

type Middleware func(next http.Handler) http.Handler

func NewMiddlewareChain(xs ...Middleware) Middleware {
	return func(next http.Handler) http.Handler {
		for i := len(xs) - 1; i >= 0; i-- {
			x := xs[i]
			next = x(next)
		}
		return next
	}
}

func NewTimeoutContextMW(timeoutInSec int) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				ctx, cancel := context.WithTimeout(context.Background(), time.Second*time.Duration(timeoutInSec))
				defer cancel()

				r = r.WithContext(ctx)
				next.ServeHTTP(w, r)
			})
	}
}

func NewRequestLoggerMW(logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			slog.Info("Received request",
				slog.String("ip", r.RemoteAddr),
				slog.String("proto", r.Proto),
				slog.String("method", r.Method),
				slog.String("uri", r.RequestURI),
			)
			next.ServeHTTP(w, r)
		})
	}
}

func RecoverPanicMW(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Connection", "close")
				if err, ok := err.(error); ok {
					slog.Error("Recovered panic", slog.Any("error", err))
					http.Error(w, "Undefined error", http.StatusInternalServerError)
				}
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func NewCorsMW(allowedOrigins map[string]bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if the Origin is allowed
			if _, allowed := allowedOrigins[origin]; allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			}

			// Handle preflight
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
