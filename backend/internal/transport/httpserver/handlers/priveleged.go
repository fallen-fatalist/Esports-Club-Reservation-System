package handlers

import "net/http"

// @Summary		Check if user is privileged
// @Description	Returns a 200 status if user is privileged
// @Tags			Auth
// @Success		200
// @Router			/auth/priveleged [get]
func (s *Handler) IsPriveleged(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}
