package implementation

import (
	"context"
	"errors"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/service"
	"fmt"
	"log"
	"log/slog"
	"math/rand"
	"time"
)

type BookingService struct {
	repository repository.BookingRepository
}

func NewBookingService(repository repository.BookingRepository) (*BookingService, error) {
	if repository == nil {
		log.Fatal("Nil repository provided to booking service")
	}
	return &BookingService{repository: repository}, nil
}

func (s *BookingService) GetAllBookings() ([]*entities.Booking, error) {
	if bookings, err := s.repository.GetAll(); err != nil {
		return nil, err
	} else {
		return bookings, nil
	}

}

func (s *BookingService) CreateBooking(ctx context.Context, booking *entities.Booking) (int64, error) {
	if ctx.Err() != nil {
		return 0, ctx.Err()
	}

	if err := booking.Validate(); err != nil {
		return 0, err
	}

	conflict, err := s.hasBookingConflict(ctx, booking)
	if err != nil {
		return 0, err
	}
	if conflict {
		return 0, entities.ErrBookingOverlap
	}

	booking.Status = "pending"

	if id, err := s.repository.Create(ctx, booking); err != nil {
		slog.Error("Unhandled error creating booking:", slog.Any("error", err))
		return 0, service.ErrUnhandledError
	} else {
		return id, nil
	}
}

func (s *BookingService) GetComputerBookings(id int64) ([]*entities.Booking, error) {
	if err := entities.ValidateID(id); err != nil {
		return nil, err
	}

	bookings, err := s.GetAllBookings()
	if err != nil {
		slog.Error("Unhandled Error fetching pending bookings:", err)
		return nil, service.ErrUnhandledError
	}

	comp_bookings := make([]*entities.Booking, 0, len(bookings))

	for _, booking := range bookings {
		if booking.ComputerID == id {
			comp_bookings = append(comp_bookings, booking)
		}
	}

	return comp_bookings, nil
}

func (s *BookingService) GetActiveBookings() ([]*entities.Booking, error) {
	bookings, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}

	pending_bookings := make([]*entities.Booking, 0, len(bookings))

	for _, booking := range bookings {
		startTime, err := time.Parse(time.RFC3339, booking.StartTime)
		if err != nil {
			return nil, fmt.Errorf("invalid start_time: %w", err)
		}
		endTime, err := time.Parse(time.RFC3339, booking.EndTime)
		if err != nil {
			return nil, fmt.Errorf("invalid end_time: %w", err)
		}

		if booking.Status == "active" {
			pending_bookings = append(pending_bookings, &entities.Booking{
				ID:         booking.ID,
				UserID:     booking.UserID,
				ComputerID: booking.ComputerID,
				PackageID:  booking.PackageID,
				StartTime:  startTime.Format(time.RFC3339),
				EndTime:    endTime.Format(time.RFC3339),
				Status:     booking.Status,
				CreatedAt:  booking.CreatedAt,
			})
		}
	}
	return pending_bookings, nil
}

func (s *BookingService) GetPendingBookings() ([]*entities.Booking, error) {
	bookings, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}

	pending_bookings := make([]*entities.Booking, 0, len(bookings))

	for _, booking := range bookings {
		startTime, err := time.Parse(time.RFC3339, booking.StartTime)
		if err != nil {
			return nil, fmt.Errorf("invalid start_time: %w", err)
		}
		endTime, err := time.Parse(time.RFC3339, booking.EndTime)
		if err != nil {
			return nil, fmt.Errorf("invalid end_time: %w", err)
		}

		if booking.Status == "pending" {
			pending_bookings = append(pending_bookings, &entities.Booking{
				ID:         booking.ID,
				UserID:     booking.UserID,
				ComputerID: booking.ComputerID,
				PackageID:  booking.PackageID,
				StartTime:  startTime.Format(time.RFC3339),
				EndTime:    endTime.Format(time.RFC3339),
				Status:     booking.Status,
				CreatedAt:  booking.CreatedAt,
			})
		}
	}
	return pending_bookings, nil
}

func (s *BookingService) GetFinishedBookings() ([]*entities.Booking, error) {
	bookings, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}

	finished_bookings := make([]*entities.Booking, 0, len(bookings))

	for _, booking := range bookings {
		startTime, err := time.Parse(time.RFC3339, booking.StartTime)
		if err != nil {
			return nil, fmt.Errorf("invalid start_time: %w", err)
		}
		endTime, err := time.Parse(time.RFC3339, booking.EndTime)
		if err != nil {
			return nil, fmt.Errorf("invalid end_time: %w", err)
		}

		if booking.Status == "finished" {
			finished_bookings = append(finished_bookings, &entities.Booking{
				ID:         booking.ID,
				UserID:     booking.UserID,
				ComputerID: booking.ComputerID,
				PackageID:  booking.PackageID,
				StartTime:  startTime.Format(time.RFC3339),
				EndTime:    endTime.Format(time.RFC3339),
				Status:     booking.Status,
				CreatedAt:  booking.CreatedAt,
			})
		}
	}
	return finished_bookings, nil
}

func (s *BookingService) GetCancelledBookings() ([]*entities.Booking, error) {
	bookings, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}

	cancelled_bookings := make([]*entities.Booking, 0, len(bookings))

	for _, booking := range bookings {
		startTime, err := time.Parse(time.RFC3339, booking.StartTime)
		if err != nil {
			return nil, fmt.Errorf("invalid start_time: %w", err)
		}
		endTime, err := time.Parse(time.RFC3339, booking.EndTime)
		if err != nil {
			return nil, fmt.Errorf("invalid end_time: %w", err)
		}

		if booking.Status == "cancelled" {
			cancelled_bookings = append(cancelled_bookings, &entities.Booking{
				ID:         booking.ID,
				UserID:     booking.UserID,
				ComputerID: booking.ComputerID,
				PackageID:  booking.PackageID,
				StartTime:  startTime.Format(time.RFC3339),
				EndTime:    endTime.Format(time.RFC3339),
				Status:     booking.Status,
				CreatedAt:  booking.CreatedAt,
			})
		}
	}
	return cancelled_bookings, nil

}

func (s *BookingService) GetComputersLeftOccupiedTime() ([]*entities.ComputerOccupiedLeftTime, error) {
	bookings, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	var leftSeconds int64
	leftTimes := make([]*entities.ComputerOccupiedLeftTime, 0, len(bookings))

	for _, booking := range bookings {
		if booking.Status == "active" {
			endTime, err := time.Parse(time.RFC3339, booking.EndTime)
			if err != nil {
				return nil, fmt.Errorf("invalid end_time format for booking %d: %w", booking.ID, err)
			}

			if endTime.After(now) {
				leftDuration := endTime.Sub(now)
				leftSeconds = int64(leftDuration.Seconds())
			} else {
				leftSeconds = 0
				s.repository.Update(&entities.Booking{
					ID:         booking.ID,
					UserID:     booking.UserID,
					ComputerID: booking.ComputerID,
					PackageID:  booking.PackageID,
					StartTime:  booking.StartTime,
					EndTime:    booking.EndTime,
					Status:     "finished",
					CreatedAt:  booking.CreatedAt,
				})
			}
		}

		leftTimes = append(leftTimes, &entities.ComputerOccupiedLeftTime{
			ComputerID:  booking.ComputerID,
			LeftSeconds: leftSeconds,
		})
	}

	return leftTimes, nil
}

func (s *BookingService) GetComputerLeftOccupiedTime(id int64) (*entities.ComputerOccupiedLeftTime, error) {
	bookings, err := s.GetComputerBookings(id)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()

	leftTime := entities.ComputerOccupiedLeftTime{
		ComputerID:  id,
		LeftSeconds: 0,
	}

	for _, booking := range bookings {
		if booking.Status == "active" {
			endTime, err := time.Parse(time.RFC3339, booking.EndTime)
			if err != nil {
				return nil, fmt.Errorf("invalid end_time format for booking %d: %w", booking.ID, err)
			}

			if endTime.After(now) {
				leftDuration := endTime.Sub(now)
				return &entities.ComputerOccupiedLeftTime{
					ComputerID:  booking.ComputerID,
					LeftSeconds: int64(leftDuration.Seconds()),
				}, nil
			} else {
				return &leftTime, nil
			}
		}
	}

	// No active booking found
	return &leftTime, nil
}

func (s *BookingService) RefreshBookings() {
	s.repository.RefreshStatus()
}

const eps = 0.0000000001

func (s *BookingService) GenerateBooking(ctx context.Context) {
	var retryNum = 0
	userID := int64(rand.Intn(43) + 1)
	computerID := int64(rand.Intn(40) + 1)

	startTime := time.Now().UTC().Add(time.Duration(rand.Intn(31)+30) * time.Minute)
	endTime := startTime.Add(time.Duration(rand.Intn(3)+1) * time.Hour)

	var packageID int
	diff := endTime.Sub(startTime).Hours()
	switch {
	case diff-1.0 < eps:
		packageID = 1
	case diff-2.0 < eps:
		packageID = 2
	case diff-3.0 < eps:
		packageID = 3
	}

	generatedBooking := &entities.Booking{
		UserID:     userID,
		ComputerID: computerID,
		PackageID:  int64(packageID),
		StartTime:  startTime.Format(time.RFC3339),
		EndTime:    endTime.Format(time.RFC3339),
		Status:     "pending",
	}

	_, err := s.CreateBooking(ctx, generatedBooking)
	if err != nil {
		if errors.Is(err, entities.ErrBookingOverlap) {
			s.GenerateBooking(ctx)
		}

		retryNum++
		if retryNum >= 5 {
			return
		} else {
			s.GenerateBooking(ctx)

		}
		// If incorrect values while validation should retry

		slog.Error("Unhandled error creating booking:", slog.Any("error", err))
		if ctx.Err() != nil {
			return
		}
	}
}

func (s *BookingService) hasBookingConflict(ctx context.Context, newBooking *entities.Booking) (bool, error) {
	newStart, err := time.Parse(time.RFC3339, newBooking.StartTime)
	if err != nil {
		return false, fmt.Errorf("invalid start_time: %w", err)
	}
	newEnd, err := time.Parse(time.RFC3339, newBooking.EndTime)
	if err != nil {
		return false, fmt.Errorf("invalid end_time: %w", err)
	}

	existingBookings, err := s.GetComputerBookings(newBooking.ComputerID)
	if err != nil {
		return false, err
	}

	for _, existing := range existingBookings {
		if existing.Status == "cancelled" || existing.Status == "finished" {
			continue // ignore completed bookings
		}

		existingStart, _ := time.Parse(time.RFC3339, existing.StartTime)
		existingEnd, _ := time.Parse(time.RFC3339, existing.EndTime)

		if newStart.Before(existingEnd) && newEnd.After(existingStart) {
			return true, nil
		}
	}

	return false, nil
}
