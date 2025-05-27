package entities

import (
	"errors"
	"esports_club_booking/internal/utils"
	"fmt"
	"log/slog"
	"strings"
	"time"
)

type Booking struct {
	ID         int64  `json:"id,omitempty"`
	UserID     int64  `json:"user_id"`
	ComputerID int64  `json:"computer_id"`
	PackageID  int64  `json:"package_id"`
	IsNotified bool   `json:"is_notified"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
	Status     string `json:"status,omitempty"`
	CreatedAt  string `json:"created_at,omitempty"`
}

type ComputerOccupiedLeftTime struct {
	ComputerID  int64 `json:"id"`
	LeftSeconds int64 `json:"left_time"`
}

var bookingStatuses = []string{
	"pending",
	"active",
	"finished",
	"cancelled",
}

func (b *Booking) Compare(secondBooking *Booking) int {
	t1, err1 := time.Parse(time.RFC3339, b.StartTime)
	t2, err2 := time.Parse(time.RFC3339, secondBooking.StartTime)

	// If parsing fails, fall back to string comparison (not recommended)
	if err1 != nil || err2 != nil {
		slog.Error("Error parsing time while comparing Bookings:", slog.Any("error", err1))
		return 0
	}

	return int(t1.Unix()) - int(t2.Unix())
}

// Errors
var (
	ErrBookingNotExists        = errors.New("booking not exists")
	ErrNotCorrespondenceOfRoom = errors.New("package in booking must correspond to the computer room")
	ErrBookingOverlap          = errors.New("booking overlaps with another booking")
)

var (
	ErrNegativeUserID         = errors.New("user_id must be a positive number")
	ErrNegativeComputerID     = errors.New("computer_id must be a positive number")
	ErrInvalidPackageZero     = errors.New("package must not be zero")
	ErrInvalidPackageNegative = errors.New("package must not be negative")
	ErrInvalidStartTimeFormat = errors.New("start_time must be in ISO 8601 format")
	ErrInvalidEndTimeFormat   = errors.New("end_time must be in ISO 8601 format")
	ErrStartTimeInPast        = errors.New("start_time must be in the future")
	ErrEndBeforeStart         = errors.New("end_time must be after start_time")
	ErrNonHourlyDuration      = errors.New("booking duration must be a whole number of hours")
	ErrEmptyStatus            = errors.New("status must not be empty")
)

func (b *Booking) Validate() error {
	// Validate IDs
	if b.UserID <= 0 {
		return ErrInvalidUserID
	}
	if b.ComputerID <= 0 {
		return ErrNegativeComputerID
	}

	// Validate Package
	if b.PackageID == 0 {
		return ErrInvalidPackageZero
	}
	if b.PackageID < 0 {
		return ErrInvalidPackageNegative
	}

	// Parse StartTime and EndTime
	start, err := time.Parse(time.RFC3339, b.StartTime)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidStartTimeFormat, err)
	}
	end, err := time.Parse(time.RFC3339, b.EndTime)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidEndTimeFormat, err)
	}

	now := time.Now().UTC()
	if !start.After(now) {
		return ErrStartTimeInPast
	}
	if !end.After(start) {
		return ErrEndBeforeStart
	}
	if end.Sub(start)%time.Hour != 0 {
		return ErrNonHourlyDuration
	}

	// Validate Status
	if strings.TrimSpace(b.Status) == "" {
		return ErrEmptyStatus
	}
	if !utils.In(b.Status, bookingStatuses) {
		return ErrInvalidStatus
	}

	return nil
}
