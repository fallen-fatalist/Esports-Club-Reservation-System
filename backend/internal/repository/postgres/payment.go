package postgres

import (
	"context"
	"database/sql"
	"errors"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"fmt"
)

var _ repository.PaymentRepository = (*PaymentRepository)(nil)

type PaymentRepository struct {
	db *sql.DB
}

func NewPaymentRepository(db *sql.DB) (*PaymentRepository, error) {
	if db == nil {
		return nil, fmt.Errorf("database connection cannot be nil")
	}
	return &PaymentRepository{db: db}, nil
}

func (r *PaymentRepository) Deposit(ctx context.Context, user *entities.User, amount float64) (int64, error) {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelSerializable,
	})

	amount *= entities.DollarInTenge

	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	const depositQuery = `
		UPDATE users
		SET balance = $1
		WHERE user_id = $2
		RETURNING user_id
	`

	_, err = tx.QueryContext(ctx, depositQuery, user.Balance+amount, user.ID)
	if err != nil {
		return 0, fmt.Errorf("failed to update users: %w", err)
	}

	return user.ID, tx.Commit()
}

func (r *PaymentRepository) PayBooking(ctx context.Context, booking *entities.Booking, amount float64) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelSerializable,
	})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1. Create booking record
	bookingQuery := `
		INSERT INTO bookings 
		(user_id, computer_id, package_id, start_time, end_time, status) 
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING booking_id, created_at
	`

	err = tx.QueryRowContext(ctx, bookingQuery,
		booking.UserID,
		booking.ComputerID,
		booking.PackageID,
		booking.StartTime,
		booking.EndTime,
		"pending",
	).Scan(&booking.ID, &booking.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create booking: %w", err)
	}

	// 2. Process payment
	paymentQuery := `
		UPDATE users
		SET balance = balance - $1
		WHERE user_id = $2 AND balance >= $1
		RETURNING balance
	`
	var newBalance float64
	err = tx.QueryRowContext(ctx, paymentQuery, amount, booking.UserID).Scan(&newBalance)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("insufficient funds or user not found")
		}
		return fmt.Errorf("failed to process payment: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

func (r *PaymentRepository) CancelBooking(ctx context.Context, booking *entities.Booking, amount float64) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelSerializable,
	})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1. Update booking status
	statusQuery := `
		UPDATE bookings
		SET status = 'cancelled'
		WHERE booking_id = $1
		RETURNING user_id
	`
	var userID int64
	err = tx.QueryRowContext(ctx, statusQuery, booking.ID).Scan(&userID)
	if err != nil {
		return fmt.Errorf("failed to cancel booking: %w", err)
	}

	// 2. Process refund
	refundQuery := `
		UPDATE users
		SET balance = balance + $1
		WHERE user_id = $2
	`
	_, err = tx.ExecContext(ctx, refundQuery, amount, userID)
	if err != nil {
		return fmt.Errorf("failed to process refund: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}
