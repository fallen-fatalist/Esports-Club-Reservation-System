package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/views"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
)

// @Summary		Get all users
// @Description	Returns a list of all users
// @Tags			Users
// @Security BearerAuth
// @Produce		json
// @Success		200	{array}		entities.User	"List of users"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/users [get]
func (s *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := s.service.UserService.GetUsers()
	if err != nil {
		s.logger.Error("failed to get users", slog.Any("error", err))
		http.Error(w, "Internal server error, Please message administrators", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		s.logger.Error("error encoding users JSON", slog.Any("error", err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// @Summary		Delete a user
// @Description	Deletes a user with the given ID.
// @Tags			Users
// @Security BearerAuth
// @Param			id	path		int64	true	"User ID"
// @Success		204
// @Failure		400	{object}	utils.HTTPError	"Invalid user ID"
// @Failure		404	{object}	utils.HTTPError	"User not found"
// @Failure		500	{object}	utils.HTTPError	"Internal server error"
// @Router			/api/users/{id} [delete]
func (s *Handler) HandleUserDelete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	userID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	err = s.service.UserService.Delete(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrUserNotFound):
			views.WriteError(w, http.StatusNotFound, err)
			return
		case errors.Is(err, entities.ErrZeroID), errors.Is(err, entities.ErrNegativeID):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrInsufficientPriv):
			views.WriteError(w, http.StatusForbidden, err)
			return
		case errors.Is(err, entities.ErrUnhandledError):
			views.WriteError(w, http.StatusInternalServerError, err)
			return
		default:
			slog.Error("error deleting user", slog.Any("error", err))
			views.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "unhandled error, please contact administrator."})
			return
		}

	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary      Fill user balance
// @Description  Adds a specified amount to the user's balance using their ID.
// @Tags         Users
// @Security     BearerAuth
// @Param        id      path    int64   true  "User ID"
// @Param        amount  query   float64 true  "Amount to add to user's balance"
// @Success      204
// @Failure      400     {object} utils.HTTPError "Invalid user ID or balance"
// @Failure      404     {object} utils.HTTPError "User not found"
// @Failure      500     {object} utils.HTTPError "Internal server error"
// @Router       /api/users/{id}/credit [post]
func (s *Handler) HandleUserCredit(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("id")

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	balanceStr := r.URL.Query().Get("amount")

	balance, err := strconv.ParseFloat(balanceStr, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	err = s.service.UserService.UserBalanceFill(r.Context(), userID, balance)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrUserNotFound):
			views.WriteError(w, http.StatusNotFound, err)
			return
		case errors.Is(err, entities.ErrZeroID), errors.Is(err, entities.ErrNegativeID):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrNegativeOrZeroAmount):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrUnhandledError):
			views.WriteError(w, http.StatusInternalServerError, err)
			return
		default:
			slog.Error("error filling user balance", slog.String("userID", userIDStr), slog.String("balance", balanceStr), slog.Any("error", err))
			views.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "unhandled error, please contact administrator."})
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary      Grant admin privileges to a user
// @Description  Grants admin privileges to a user with the given ID, only Owner and Manager can grant admin role.
// @Tags         Users
// @Security     BearerAuth
// @Param        id    path  int64   true  "User ID"
// @Param        role  path  string  true  "User Role" Enums(owner, manager, admin, analyst, client)
// @Success      204
// @Failure      400  {object}  utils.HTTPError  "Invalid user ID"
// @Failure      404  {object}  utils.HTTPError  "User not found"
// @Failure      500  {object}  utils.HTTPError  "Internal server error"
// @Router       /api/users/{id}/admin [post]
func (s *Handler) HandleGrantAdmin(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	role := r.PathValue("role")
	userID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		views.WriteError(w, http.StatusBadRequest, entities.ErrNonNumericID)
		return
	}

	err = s.service.UserService.GrantAdmin(userID, role)
	if err != nil {
		switch {
		case errors.Is(err, entities.ErrUserNotFound):
			views.WriteError(w, http.StatusNotFound, err)
			return
		case errors.Is(err, entities.ErrZeroID), errors.Is(err, entities.ErrNegativeID):
			views.WriteError(w, http.StatusBadRequest, err)
			return
		case errors.Is(err, entities.ErrUnhandledError):
			views.WriteError(w, http.StatusInternalServerError, err)
			return
		default:
			slog.Error("error granting admin to user", slog.Int64("userID", userID), slog.Any("error", err))
			views.WriteJSON(w, http.StatusInternalServerError, dto.JSONAnswer{Message: "unhandled error, please contact administrator."})
			return
		}
	}

}

// UploadPFP handles profile picture upload
func (h *Handler) UploadPFP(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (32MB max)
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	// Get user ID from URL params
	vars := mux.Vars(r)
	userIDStr := vars["userID"]
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Get file from form
	file, header, err := r.FormFile("profile_picture")
	if err != nil {
		http.Error(w, "No file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !isValidImageType(contentType) {
		http.Error(w, "Invalid file type. Only JPEG, PNG, and WebP are allowed", http.StatusBadRequest)
		return
	}

	// Validate file size (5MB max)
	if header.Size > 5*1024*1024 {
		http.Error(w, "File size too large. Maximum 5MB allowed", http.StatusBadRequest)
		return
	}

	// Generate filename: user_id_timestamp.extension
	ext := getFileExtension(contentType)
	filename := fmt.Sprintf("user_%d_%d%s", userID, time.Now().Unix(), ext)

	// Upload to MinIO
	_, err = h.minioClient.client.PutObject(
		r.Context(),
		"pfp",
		filename,
		file,
		header.Size,
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)
	if err != nil {
		http.Error(w, "Failed to upload image", http.StatusInternalServerError)
		return
	}

	// Generate presigned URL for immediate use
	imageURL, err := h.minioClient.GetFileURL(r.Context(), filename)
	if err != nil {
		// Upload succeeded but URL generation failed
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(Response{
			Success: true,
			Message: "Image uploaded successfully",
			Data: map[string]string{
				"filename": filename,
			},
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Image uploaded successfully",
		Data: PFPResponse{
			ImageURL: imageURL,
			Filename: filename,
		},
	})
}

// GetPFPURL returns the presigned URL for a profile picture
func (h *Handler) GetPFPURL(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr := vars["userID"]
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Get filename from query param or generate pattern
	filename := r.URL.Query().Get("filename")
	if filename == "" {
		// If no specific filename, find the latest pfp for this user
		// This requires listing objects and finding the most recent one
		filename, err = h.findLatestPFP(r.Context(), userID)
		if err != nil {
			http.Error(w, "Profile picture not found", http.StatusNotFound)
			return
		}
	}

	// Generate presigned URL
	imageURL, err := h.minioClient.GetFileURL(r.Context(), filename)
	if err != nil {
		http.Error(w, "Failed to generate image URL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "URL generated successfully",
		Data: PFPResponse{
			ImageURL: imageURL,
			Filename: filename,
		},
	})
}

// DeletePFP deletes a profile picture
func (h *Handler) DeletePFP(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr := vars["userID"]
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Get filename from query param
	filename := r.URL.Query().Get("filename")
	if filename == "" {
		http.Error(w, "Filename is required", http.StatusBadRequest)
		return
	}

	// Validate that the filename belongs to this user (security check)
	if !strings.HasPrefix(filename, fmt.Sprintf("user_%d_", userID)) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	// Delete from MinIO
	err = h.minioClient.client.RemoveObject(r.Context(), "pfp", filename, minio.RemoveObjectOptions{})
	if err != nil {
		http.Error(w, "Failed to delete image", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Profile picture deleted successfully",
	})
}

// Helper function to find the latest profile picture for a user
func (h *Handler) findLatestPFP(ctx context.Context, userID int64) (string, error) {
	prefix := fmt.Sprintf("user_%d_", userID)

	// List objects with the user prefix
	objectCh := h.minioClient.client.ListObjects(ctx, "pfp", minio.ListObjectsOptions{
		Prefix: prefix,
	})

	var latestFile string
	var latestTime int64

	for object := range objectCh {
		if object.Err != nil {
			return "", object.Err
		}

		// Extract timestamp from filename (user_123_1234567890.jpg)
		parts := strings.Split(object.Key, "_")
		if len(parts) >= 3 {
			timestampStr := strings.Split(parts[2], ".")[0]
			timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
			if err == nil && timestamp > latestTime {
				latestTime = timestamp
				latestFile = object.Key
			}
		}
	}

	if latestFile == "" {
		return "", fmt.Errorf("no profile picture found for user %d", userID)
	}

	return latestFile, nil
}

// Helper functions
func isValidImageType(contentType string) bool {
	validTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/webp",
	}

	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	return false
}

func getFileExtension(contentType string) string {
	switch contentType {
	case "image/jpeg", "image/jpg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		return ".jpg"
	}
}
