package entities

import (
	"database/sql"
	"time"
)

type EmailVerification struct {
	Email        string
	Code         string
	Type         string
	Attempts     int
	LastAttempt  sql.NullTime
	BlockedUntil sql.NullTime
	CreatedAt    time.Time
	ExpiresAt    time.Time
}
