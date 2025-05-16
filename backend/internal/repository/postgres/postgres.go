package postgres

import (
	"context"
	"database/sql"
	"esports_club_booking/internal/config"
	"log/slog"
	"time"

	_ "github.com/lib/pq"
)

const (
	maxRetries    = 3               // Try 3 times (15 seconds total if we wait 5 seconds between retries)
	retryInterval = 5 * time.Second // Retry every 5 seconds
)

func OpenDB(cfg config.DataBase) (*sql.DB, error) {
	if cfg.Host == "" || cfg.User == "" || cfg.Password == "" || cfg.Name == "" || cfg.Port == "" {
		panic("Some database environment variable is empty")
	}

	dsn := cfg.DSN()
	var db *sql.DB
	var err error

	for range maxRetries {
		db, err = sql.Open("postgres", dsn)
		if err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			err = db.PingContext(ctx)
			if err == nil {
				slog.Info("PostgreSQL database connection established")
				return db, nil
			}
		}
		time.Sleep(retryInterval)
	}

	slog.Error("Failed to connect to PostgreSQL", "error", err)
	return nil, err
}
