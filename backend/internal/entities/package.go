package entities

import "errors"

type Package struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Room      string  `json:"room"`
	Duration  int     `json:"duration"`
	StartTime string  `json:"start_time"`
	EndTime   string  `json:"end_time"`
	CreatedAt string  `json:"created_at"`
}

// Errors
var (
	ErrPackageIDNotSpecified = errors.New("package id not specified")
	ErrPackageNotFound       = errors.New("package with such id not found")
)
