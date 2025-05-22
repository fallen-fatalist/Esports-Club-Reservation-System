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
	"sort"
	"time"
)

type BookingService struct {
	repository     repository.BookingRepository
	packageService service.PackageService
	computerNumber int
}

func NewBookingService(repository repository.BookingRepository, packageService service.PackageService, computerNumber int) (*BookingService, error) {
	if repository == nil {
		log.Fatal("Nil repository provided to booking service")
	} else if packageService == nil {
		log.Fatal("Nil package service provided to booking service")
	}

	service := &BookingService{
		repository:     repository,
		packageService: packageService,
	}

	if computerNumber > 0 {
		service.computerNumber = computerNumber
	}

	return service, nil
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

	compBookings := make([]*entities.Booking, 0, len(bookings))

	for _, booking := range bookings {
		if booking.ComputerID == id {
			compBookings = append(compBookings, booking)
		}
	}

	// TODO: use binary heap
	sort.Slice(compBookings, func(i, j int) bool {
		t1, err1 := time.Parse(time.RFC3339, compBookings[i].StartTime)
		t2, err2 := time.Parse(time.RFC3339, compBookings[j].StartTime)

		// Fall back to string comparison if parsing fails
		if err1 != nil || err2 != nil {
			return false
		}

		return t1.Before(t2)
	})

	return compBookings, nil
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

// TODO: optimize the GetComputersLeftOccupiedTime with bulk query
func (s *BookingService) GetComputersLeftOccupiedTime(packageID int64) ([]*entities.ComputerOccupiedLeftTime, error) {
	leftTimes := make([]*entities.ComputerOccupiedLeftTime, 0, s.computerNumber)

	for idx := 0; idx < s.computerNumber; idx++ {
		leftTime, err := s.GetComputerLeftOccupiedTime(int64(idx), packageID)
		if err != nil {
			slog.Error("Error getting computer left occupied time:", slog.Any("error", err))
			continue
		}
		leftTimes = append(leftTimes, leftTime)
	}

	return leftTimes, nil
}

/* This function calculates the remaining occupied time for a specific computer with the given id
* For the specific time package(not Day, Night, Morning)
* Total occupied time in seconds for continuous bookings for specific computer are calculated
* If the current time less than next booking start time and difference not more than an hour, then this difference added to occupied time
* If the booking active, the difference between current time and end time will be added
 */
func (s *BookingService) GetComputerLeftOccupiedTime(computerID int64, packageID int64) (*entities.ComputerOccupiedLeftTime, error) {
	if packageID == 0 {
		return nil, entities.ErrPackageIDNotSpecified
	}

	bookings, err := s.GetComputerBookings(computerID)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()

	leftTime := entities.ComputerOccupiedLeftTime{
		ComputerID:  computerID,
		LeftSeconds: 0,
	}

	packageMap := s.packageService.PackagesMap()
	if packageMap == nil {
		slog.Error("Error while fetching package map")
		return nil, err
	}

	clubPackage := packageMap[packageID]
	if clubPackage == nil {
		return nil, entities.ErrPackageNotFound
	}

	for _, booking := range bookings {
		startTime, err := time.Parse(time.RFC3339, booking.StartTime)
		if err != nil {
			slog.Error("Error parsing time while iterating Bookings:", slog.Any("error", err))
			continue
		}

		endTime, err := time.Parse(time.RFC3339, booking.EndTime)
		if err != nil {
			slog.Error("Error parsing time while iterating Bookings:", slog.Any("error", err))
			continue
		}

		// Before the booking in duration time of the selected package

		if now.Before(startTime) && startTime.Sub(now).Hours() < float64(clubPackage.Duration) {
			leftTime.LeftSeconds += int64(startTime.Sub(now).Seconds())
			leftTime.LeftSeconds += int64(endTime.Sub(startTime).Seconds())
			// In the middle of booking
		} else if now.After(startTime) && now.Before(endTime) {
			leftTime.LeftSeconds += int64(endTime.Sub(now).Seconds())
		}

		// Move the now pointer, to end time of the booking
		now = endTime
	}

	return &leftTime, nil
}

func (s *BookingService) RefreshBookings() {
	s.repository.RefreshBookings()
}

const eps = 0.0000000001

func (s *BookingService) GenerateBooking(ctx context.Context) {
	var retryNum = 0
	userID := int64(rand.Intn(43) + 1)
	computerID := int64(rand.Intn(40) + 1)

	startTime := time.Now().UTC().Add(time.Duration(rand.Intn(30)+1) * time.Minute)
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

func (s *BookingService) UserBookings(id int64) ([]*entities.Booking, error) {
	if err := entities.ValidateID(id); err != nil {
		return nil, entities.ErrInvalidUserID
	}

	bookings, err := s.repository.GetAllByUserID(id)
	if err != nil {
		return nil, err
	}

	return bookings, nil
}
