package postgres

import (
	"database/sql"
	"time"
)

type EmailVerification struct {
	Email        string
	Code         string
	Attempts     int
	LastAttempt  sql.NullTime
	BlockedUntil sql.NullTime
	CreatedAt    time.Time
	ExpiresAt    time.Time
}
