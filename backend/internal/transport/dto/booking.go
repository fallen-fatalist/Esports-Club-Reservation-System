package dto

// Booking represents a booking request or response structure.
// swagger:model
type Booking struct {
	// UserID is the ID of the user making the booking.
	// required: true
	UserID int64 `json:"user_id" example:"12345"`

	// ComputerID is the ID of the computer being booked.
	// required: true
	ComputerID int64 `json:"computer_id" example:"67890"`

	// PackageID is the ID of the selected package for the booking.
	// required: true
	PackageID int64 `json:"package_id" example:"111"`

	// StartTime is the start time of the booking in RFC3339 format.
	// required: true
	StartTime string `json:"start_time" example:"2025-05-27T10:00:00+07:00"`

	// EndTime is the end time of the booking in RFC3339 format.
	// required: true
	EndTime string `json:"end_time" example:"2025-05-27T12:00:00+07:00"`
}
