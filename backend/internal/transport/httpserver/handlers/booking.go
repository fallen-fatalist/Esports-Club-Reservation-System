package handlers

import (
	"context"
	"encoding/json"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/service"
	"log/slog"
	"net/http"
	"strconv"
	"time"
)

// @Summary		Get all bookings with time format "2006-01-02T15:04:05Z07:00"
// @Description	Returns a list of bookings with various statuses
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Success		200	{array}		entities.Booking
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/bookings [get]
func (s *Handler) Bookings(w http.ResponseWriter, r *http.Request) {
	bookings, err := s.service.BookingService.GetAllBookings()
	if err != nil {
		slog.Error("Error fetching bookings:", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	} else if len(bookings) == 0 {
		jsonPayload := JSONAnswer{
			Message: "No bookings",
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(jsonPayload); err != nil {
			slog.Error("Error encoding JSON:", slog.Any("error", err))
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
		return
	}

	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		slog.Error("Error encoding JSON:", slog.Any("error", err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary		Create a new booking
// @Description	Creates a new booking with the given details
// @Tags			Bookings
// @Security BearerAuth
// @Accept			json
// @Produce		json
// @Param			booking	body		entities.Booking	true	"Booking details"
// @Success		201		{object}	handlers.JSONAnswer	"Booking created successfully"
// @Failure		400		{object}	handlers.JSONAnswer	"Invalid request body"
// @Failure		500		{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/bookings [post]
func (s *Handler) PostBooking(w http.ResponseWriter, r *http.Request) {

	var booking entities.Booking

	// Parse the JSON body into the struct
	if err := json.NewDecoder(r.Body).Decode(&booking); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	id, err := s.service.BookingService.CreateBooking(ctx, &booking)
	if err != nil {
		if err == service.ErrUnhandledError {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		} else {
			jsonPayload := JSONAnswer{
				Message: err.Error(),
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			err = json.NewEncoder(w).Encode(jsonPayload)
			if err != nil {
				slog.Error("Error encoding JSON:", err)
				http.Error(w, "Failed to encode response", http.StatusInternalServerError)
				return
			}
			return
		}
	}

	jsonPayload := JSONAnswer{
		Message: "Booking created successfully",
		ID:      id,
	}

	// For now, just respond with success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(jsonPayload)
	if err != nil {
		slog.Error("Error encoding JSON:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

}
func (s *Handler) BookingsOptions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodOptions:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
	default:
		// Handle Method Not Allowed
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// @Summary		Get bookings for a specific computer with time format "2006-01-02T15:04:05Z07:00"
// @Description	Returns a list of bookings for the specified computer ID
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Param			id	path		int64				true	"Computer ID"
// @Success		200	{array}		entities.Booking	"List of bookings for the computer"
// @Failure		400	{object}	handlers.JSONAnswer	"Invalid computer ID"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/computers/{id}/bookings [get]
func (s *Handler) ComputerBookings(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		jsonPayload := JSONAnswer{
			Message: "Invalid computer ID",
		}
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(jsonPayload); err != nil {
			slog.Error("Error encoding JSON:", slog.Any("error", err))
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
		return
	}

	bookings, err := s.service.BookingService.GetComputerBookings(id)
	if err != nil {
		slog.Error("Error fetching bookings:", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	} else if len(bookings) == 0 {
		jsonPayload := JSONAnswer{
			Message: "No bookings",
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(jsonPayload); err != nil {
			slog.Error("Error encoding JSON:", slog.Any("error", err))
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		slog.Error("Error encoding JSON:", slog.Any("error", err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

}

// @Summary		Get finished bookings with time format "2006-01-02T15:04:05Z07:00"
// @Description	Returns a list of finished bookings
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Success		200	{array}		entities.Booking	"List of finished bookings"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/bookings/finished [get]
func (s *Handler) getFinishedBookings(w http.ResponseWriter, r *http.Request) {
	bookings, err := s.service.BookingService.GetFinishedBookings()
	if err != nil {
		slog.Error("Error fetching finished bookings:", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		slog.Error("Error encoding JSON:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}

}
func (s *Handler) HandleFinishedBookings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.getFinishedBookings(w, r)
	default:
		w.Header().Set("Allow", "GET")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// @Summary		Get pending bookings with time format "2006-01-02T15:04:05Z07:00"
// @Description	Returns a list of pending bookings
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Success		200	{array}		entities.Booking	"List of pending bookings"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/bookings/pending [get]
func (s *Handler) getPendingBookings(w http.ResponseWriter, r *http.Request) {
	bookings, err := s.service.BookingService.GetPendingBookings()
	if err != nil {
		slog.Error("Error fetching pending bookings:", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		slog.Error("Error encoding JSON:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func (s *Handler) HandlePendingBookings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.getPendingBookings(w, r)
	default:
		w.Header().Set("Allow", "GET")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// @Summary		Get active bookings with time format "2006-01-02T15:04:05Z07:00"
// @Description	Returns a list of active bookings
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Success		200	{array}		entities.Booking	"List of active bookings"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/bookings/active [get]
func (s *Handler) getActiveBookings(w http.ResponseWriter, r *http.Request) {
	activeBookings, err := s.service.BookingService.GetActiveBookings()
	if err != nil {
		slog.Error("Error fetching active bookings:", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(activeBookings); err != nil {
		slog.Error("Error encoding JSON:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}

}

func (s *Handler) HandleActiveBookings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.getActiveBookings(w, r)
	default:
		w.Header().Set("Allow", "GET")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// @Summary		Get cancelled bookings with time format "2006-01-02T15:04:05Z07:00"
// @Description	Returns a list of cancelled bookings
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Success		200	{array}		entities.Booking	"List of cancelled bookings"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error"
// @Router			/api/bookings/cancelled [get]
func (s *Handler) getCancelledBookings(w http.ResponseWriter, r *http.Request) {
	cancelledBookings, err := s.service.BookingService.GetCancelledBookings()
	if err != nil {
		slog.Error("Error fetching cancelled bookings:", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(cancelledBookings); err != nil {
		slog.Error("Error encoding JSON:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}

}

func (s *Handler) HandleCancelledBookings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.getCancelledBookings(w, r)
	default:
		w.Header().Set("Allow", "GET")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// @Summary		Get remaining occupied time for a computer
// @Description	Returns the remaining time (in seconds) that a specific computer will be occupied before it becomes available for a new booking with the given package duration.
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Param			id			path		int64								true	"ID of the computer to check availability for"
// @Param			packageID	query		int64								true	"ID of the package whose duration will be used in the calculation"
// @Success		200			{object}	entities.ComputerOccupiedLeftTime	"Remaining time the computer is occupied"
// @Failure		400			{object}	handlers.JSONAnswer					"Invalid computer ID or package ID"
// @Failure		500			{object}	handlers.JSONAnswer					"Internal server error"
// @Router			/api/computers/{id}/remaining [get]
func (s *Handler) HandleComputerRemaining(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		computerIDStr := r.PathValue("id")
		computerID, err := strconv.ParseInt(computerIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid computer ID", http.StatusBadRequest)
			return
		}

		packageIDStr := r.URL.Query().Get("packageID")
		if packageIDStr == "" {
			http.Error(w, "Missing packageID parameter", http.StatusBadRequest)
			return
		}

		packageID, err := strconv.ParseInt(packageIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid packageID parameter", http.StatusBadRequest)
			return
		}

		computerLeftTime, err := s.service.BookingService.GetComputerLeftOccupiedTime(computerID, packageID)
		if err != nil {
			slog.Error("Error fetching computer left time:", slog.Any("error", err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(computerLeftTime); err != nil {
			slog.Error("Error encoding JSON:", err)
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	default:
		w.Header().Set("Allow", "GET")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// @Summary		Get remaining occupied time for all computers
// @Description	Returns a list of computers with the remaining time (in seconds) each will be occupied before becoming available for booking with the specified package.
// @Tags			Bookings
// @Accept			json
// @Produce		json
// @Param			packageID	query		int64								true	"ID of the package used to calculate remaining occupied time"
// @Success		200			{array}		entities.ComputerOccupiedLeftTime	"List of computers and their remaining occupied time"
// @Failure		400			{object}	handlers.JSONAnswer					"Invalid package ID"
// @Failure		500			{object}	handlers.JSONAnswer					"Internal server error"
// @Router			/api/computers/remaining [get]
func (s *Handler) ComputersRemaining(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		packageIDStr := r.URL.Query().Get("packageID")
		if packageIDStr == "" {
			http.Error(w, "Missing packageID parameter", http.StatusBadRequest)
			return
		}

		packageID, err := strconv.ParseInt(packageIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid packageID parameter", http.StatusBadRequest)
			return
		}

		computersLeftTime, err := s.service.BookingService.GetComputersLeftOccupiedTime(packageID)
		if err != nil {
			slog.Error("Error fetching computers left time:", slog.Any("error", err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(computersLeftTime); err != nil {
			slog.Error("Error encoding JSON:", err)
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	default:
		w.Header().Set("Allow", "GET")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// @Summary		Get bookings for a specific user
// @Description	Returns a list of bookings for the specified user ID
// @Tags			Bookings
// @Security BearerAuth
// @Accept			json
// @Produce		json
// @Param			id	path		int64				true	"User ID"
// @Success		200	{array}		entities.Booking	"List of bookings for the user"
// @Failure		400	{object}	handlers.JSONAnswer	"Invalid user ID"
// @Failure		404	{object}	handlers.JSONAnswer	"User not found"
// @Failure		500	{object}	handlers.JSONAnswer	"Internal server error or unhandled error"
// @Router			/api/users/{id}/bookings [get]
func (s *Handler) UserBookings(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)

	if err != nil {
		jsonPayload := JSONAnswer{
			Message: "Invalid user ID",
		}
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(jsonPayload); err != nil {
			slog.Error("Error encoding JSON:", slog.Any("error", err))
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
		return
	}

	bookings, err := s.service.BookingService.UserBookings(id)
	if err != nil {
		switch err {
		case entities.ErrUserNotFound:
			jsonPayload := JSONAnswer{
				Message: "User not found",
			}
			w.WriteHeader(http.StatusNotFound)
			w.Header().Set("Content-Type", "application/json")
			if err := json.NewEncoder(w).Encode(jsonPayload); err != nil {
				slog.Error("Error encoding JSON:", slog.Any("error", err))
				http.Error(w, "Failed to encode response", http.StatusInternalServerError)
				return
			}
			return
		case entities.ErrInvalidUserID:
			jsonPayload := JSONAnswer{
				Message: "Invalid user ID",
			}
			w.WriteHeader(http.StatusBadRequest)
			w.Header().Set("Content-Type", "application/json")
			if err := json.NewEncoder(w).Encode(jsonPayload); err != nil {
				slog.Error("Error encoding JSON:", slog.Any("error", err))
				http.Error(w, "Failed to encode response", http.StatusInternalServerError)
				return
			}

		}
		slog.Error("Error fetching bookings:", slog.Any("error", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(bookings); err != nil {
		slog.Error("Error encoding JSON:", slog.Any("error", err))
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
