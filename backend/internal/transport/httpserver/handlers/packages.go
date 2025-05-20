package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// @Summary		Get all packages
// @Description	Returns a list of all packages
// @Tags			Packages
// @Produce		json
// @Success		200	{array}		entities.Package	"List of computers"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/packages [get]
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
