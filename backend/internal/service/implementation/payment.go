package implementation

import (
	"context"
	"errors"
	"fmt"
	"time"

	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/repository/paypal"
)

const (
	maxStatusAttempts = 5
	statusCheckDelay  = 20 * time.Second
)

type PaymentService struct {
	paypalClient *paypal.PayPalClient
	repo         repository.Repository
}

func NewPaymentService(client *paypal.PayPalClient, repo repository.Repository) *PaymentService {
	return &PaymentService{
		paypalClient: client,
		repo:         repo,
	}
}

func (s *PaymentService) Deposit(ctx context.Context, user *entities.User, amount float64) error {
	orderID, err := s.paypalClient.Deposit(amount, user.Email, "Deposit to your account")
	if err != nil {
		return fmt.Errorf("paypal deposit failed: %w", err)
	}

	if err := s.verifyPaymentCompletion(ctx, orderID); err != nil {
		return fmt.Errorf("payment verification failed: %w", err)
	}

	user.Balance += amount
	if _, err := s.repo.UserRepository.Update(user); err != nil {
		return fmt.Errorf("failed to update user balance: %w", err)
	}

	return nil
}

func (s *PaymentService) verifyPaymentCompletion(ctx context.Context, orderID string) error {
	for attempt := 0; attempt < maxStatusAttempts; attempt++ {
		status, err := s.paypalClient.CheckOrderStatus(orderID)
		if err != nil {
			return fmt.Errorf("failed to check payment status: %w", err)
		}

		switch status {
		case "SUCCESS":
			return nil
		case "DENIED", "FAILED":
			return entities.ErrPaymentFailed
		case "CANCELED":
			return entities.ErrPaymentCanceled
		case "PENDING", "PROCESSING", "CREATED":
			if err := s.waitForNextCheck(ctx); err != nil {
				return err
			}
		default:
			return errors.Join(entities.ErrUnknownPaymentStatus, fmt.Errorf("status: %s", status))
		}
	}

	return entities.ErrPaymentTimeout
}

func (s *PaymentService) waitForNextCheck(ctx context.Context) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(statusCheckDelay):
		return nil
	}
}

func (s *PaymentService) PayBooking(ctx context.Context, booking *entities.Booking) error {
	user, err := s.repo.UserRepository.GetByID(booking.UserID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	pkg, err := s.repo.PackageRepository.GetByID(booking.PackageID)
	if err != nil {
		return fmt.Errorf("failed to get package: %w", err)
	}

	if user.Balance < pkg.Price {
		return entities.ErrInsufficientBalance
	}

	// Start transaction
	user.Balance -= pkg.Price
	if _, err := s.repo.UserRepository.Update(user); err != nil {
		return fmt.Errorf("failed to deduct balance: %w", err)
	}

	if _, err := s.repo.BookingRepository.Create(ctx, booking); err != nil {
		// Rollback balance update if booking creation fails
		user.Balance += pkg.Price
		if _, rollbackErr := s.repo.UserRepository.Update(user); rollbackErr != nil {
			return errors.Join(
				fmt.Errorf("failed to create booking: %w", err),
				fmt.Errorf("failed to rollback balance: %w", rollbackErr),
			)
		}
		return fmt.Errorf("failed to create booking: %w", err)
	}

	return nil
}

func (s *PaymentService) CancelBooking(ctx context.Context, booking *entities.Booking) error {
	user, err := s.repo.UserRepository.GetByID(booking.UserID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	pkg, err := s.repo.PackageRepository.GetByID(booking.PackageID)
	if err != nil {
		return fmt.Errorf("failed to get package: %w", err)
	}

	// Refund the amount
	user.Balance += pkg.Price
	if _, err := s.repo.UserRepository.Update(user); err != nil {
		return fmt.Errorf("failed to refund balance: %w", err)
	}

	if err := s.repo.BookingRepository.Delete(booking.ID); err != nil {
		// Rollback refund if booking deletion fails
		user.Balance -= pkg.Price
		if _, rollbackErr := s.repo.UserRepository.Update(user); rollbackErr != nil {
			return errors.Join(
				fmt.Errorf("failed to delete booking: %w", err),
				fmt.Errorf("failed to rollback refund: %w", rollbackErr),
			)
		}
		return fmt.Errorf("failed to delete booking: %w", err)
	}

	return nil
}
