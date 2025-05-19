package postgres

import (
	"context"
	"database/sql"
	"esports_club_booking/internal/entities"
	"fmt"
	"log/slog"
	"time"
)

type BookingRepository struct {
	db *sql.DB
}

func NewBookingRepository(db *sql.DB) (*BookingRepository, error) {
	if db != nil {
		return &BookingRepository{db}, nil
	}

	panic("Empty database provided to Booking repository constructor")
}

func (r *BookingRepository) GetAll() ([]*entities.Booking, error) {
	query := `
		SELECT booking_id, user_id, computer_id, package_id, start_time, end_time, status, created_at 
		FROM bookings 
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*entities.Booking

	for rows.Next() {
		var booking entities.Booking

		err = rows.Scan(
			&booking.ID,
			&booking.UserID,
			&booking.ComputerID,
			&booking.PackageID,
			&booking.StartTime,
			&booking.EndTime,
			&booking.Status,
			&booking.CreatedAt,
		)

		if err != nil {
			return nil, err
		}

		bookings = append(bookings, &booking)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return bookings, nil
}

func (r *BookingRepository) GetByID(id int64) (*entities.Booking, error) {
	var booking entities.Booking
	var startTime time.Time
	var endTime time.Time
	var createdAt time.Time

	// Try fetching from pending_bookings
	queryPending := `
		SELECT booking_id, user_id, computer_id, package_id, start_time, end_time, status, created_at
		FROM bookings
		WHERE booking_id = $1
	`
	row := r.db.QueryRow(queryPending, id)
	err := row.Scan(
		&booking.ID,
		&booking.UserID,
		&booking.ComputerID,
		&booking.PackageID,
		&startTime,
		&endTime,
		&booking.Status,
		&createdAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch booking from bookings: %w", err)
	}

	// Set time fields to ISO 8601
	booking.StartTime = startTime.UTC().Format(time.RFC3339)
	booking.EndTime = endTime.UTC().Format(time.RFC3339)
	booking.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	return &booking, nil
}

func (r *BookingRepository) Create(ctx context.Context, booking *entities.Booking) (int64, error) {
	startTime, err := time.Parse(time.RFC3339, booking.StartTime)
	if err != nil {
		return 0, fmt.Errorf("invalid start_time: %w", err)
	}

	endTime, err := time.Parse(time.RFC3339, booking.EndTime)
	if err != nil {
		return 0, fmt.Errorf("invalid end_time: %w", err)
	}

	var query string
	var id int64

	query = `
		INSERT INTO bookings 
		(user_id, computer_id, package_id, start_time, end_time, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING booking_id
	`

	err = r.db.QueryRowContext(
		ctx,
		query,
		booking.UserID,
		booking.ComputerID,
		booking.PackageID,
		startTime,
		endTime,
		booking.Status,
	).Scan(&id)

	if err != nil {
		return 0, err
	}

	return id, nil
}

func (r *BookingRepository) Update(booking *entities.Booking) (int64, error) {
	// Parse ISO 8601 time strings to time.Time
	startTime, err := time.Parse(time.RFC3339, booking.StartTime)
	if err != nil {
		return 0, fmt.Errorf("invalid start_time: %w", err)
	}

	endTime, err := time.Parse(time.RFC3339, booking.EndTime)
	if err != nil {
		return 0, fmt.Errorf("invalid end_time: %w", err)
	}

	// Prepare update query
	query := `
		UPDATE bookings
		SET 
			user_id = $1,
			computer_id = $2,
			package_id = $3,
			start_time = $4,
			end_time = $5,
			status = $6
		WHERE booking_id = $7
	`

	result, err := r.db.Exec(
		query,
		booking.UserID,
		booking.ComputerID,
		booking.PackageID,
		startTime,
		endTime,
		booking.Status,
		booking.ID,
	)
	if err != nil {
		return 0, fmt.Errorf("failed to update booking: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to retrieve affected rows: %w", err)
	}

	return rowsAffected, nil
}

func (r *BookingRepository) Delete(id int64) error {
	query := `DELETE FROM bookings WHERE booking_id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete booking: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to retrieve rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("booking with id %d not found", id)
	}

	return nil
}

func (r *BookingRepository) RefreshBookings() {
	now := time.Now().UTC()

	// 1. Set 'active' where start_time is in the past
	_, err := r.db.Exec(`
		UPDATE bookings
		SET status = 'active'
		WHERE start_time <= $1 AND $1 < end_time AND status = 'pending'
	`, now)
	if err != nil {
		slog.Error("error setting active bookings: %v", slog.Any("error", err))
	}

	// 2. Set 'finished' where end_time is in the past
	_, err = r.db.Exec(`
		UPDATE bookings
		SET status = 'finished'
		WHERE end_time < $1 AND status = 'active'
	`, now)
	if err != nil {
		slog.Error("error setting finished bookings: %v", slog.Any("error", err))
	}

	// 2. Set 'cancelled' for pending bookings that haven't started 15+ minutes after start_time
	// _, err = r.db.Exec(`
	// 	UPDATE bookings
	// 	SET status = 'cancelled'
	// 	WHERE start_time + interval '15 minutes' <= $1 AND status = 'pending'
	// `, now)
	// if err != nil {
	// 	slog.Error("error setting cancelled bookings: %v", err)
	// }
}
