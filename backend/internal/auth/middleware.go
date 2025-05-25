package auth

import (
	"context"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/utils"
	"net/http"
	"slices"
)

type contextKey string

const (
	userIDKey contextKey = "user_id"
	roleKey   contextKey = "role"
)

func WithAuth(j JWTManager, requiredRoles []string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenCookie, err := r.Cookie("jwt_token")
		if err != nil || tokenCookie.Value == "" {
			utils.WriteJSON(w, http.StatusUnauthorized, dto.JSONAnswer{Message: "missing token"})
			return
		}
		tokenStr := tokenCookie.Value

		claims, err := j.ValidateToken(tokenStr)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		allowed := slices.Contains(requiredRoles, claims.Role)

		if !allowed {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		ctx = context.WithValue(ctx, roleKey, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func GetUserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

func GetRoleFromContext(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(roleKey).(string)
	return role, ok
}
