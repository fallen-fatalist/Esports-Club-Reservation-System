package implementation

import (
	"context"
	"errors"
	"fmt"
	"time"

	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/repository/paypal"
	"esports_club_booking/internal/service"
)

var _ service.PaymentService = (*PaymentService)(nil)

const (
	maxStatusAttempts = 30
	statusCheckDelay  = 1 * time.Second
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

func (s *PaymentService) Deposit(ctx context.Context, userID int64, amount float64) (string, string, error) {
	user, err := s.repo.UserRepository.GetByID(userID)
	if err != nil {
		return "", "", fmt.Errorf("couldn't fetch user by id %w", err)
	}

	orderID, redirectURL, err := s.paypalClient.Deposit(amount, user.Email, "Deposit to your account")
	if err != nil {
		return "", "", fmt.Errorf("paypal deposit failed: %w", err)
	}

	go s.VerifyDeposit(context.Background(), userID, amount, orderID)

	return orderID, redirectURL, nil
}

func (s *PaymentService) PayBooking(ctx context.Context, booking *entities.Booking) error {
	packageItem, err := s.repo.PackageRepository.GetByID(booking.PackageID)
	if err != nil {
		return fmt.Errorf("failed to get package: %w", err)
	}

	user, err := s.repo.UserRepository.GetByID(booking.UserID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user.Balance < packageItem.Price {
		return fmt.Errorf("insufficient balance for booking: user balance %.2f, package price %.2f", user.Balance, packageItem.Price)
	}

	return s.repo.PaymentRepository.PayBooking(ctx, booking, packageItem.Price)
}

func (s *PaymentService) CancelBooking(ctx context.Context, bookingID int64) error {
	booking, err := s.repo.BookingRepository.GetByID(bookingID)
	if err != nil {
		return fmt.Errorf("failed to get booking %w", err)
	}

	if booking.Status != "pending" {
		return fmt.Errorf("booking is pending and no longer cancellable")
	}

	packageItem, err := s.repo.PackageRepository.GetByID(booking.PackageID)
	if err != nil {
		return fmt.Errorf("failed to get package: %w", err)
	}

	return s.repo.PaymentRepository.CancelBooking(ctx, booking, packageItem.Price)
}

func (s *PaymentService) VerifyDeposit(ctx context.Context, userID int64, amount float64, orderID string) {
	if err := s.verifyPaymentCompletion(ctx, orderID); err != nil {
		fmt.Printf("payment verification failed: %v\n", err)
		return
	}

	user, err := s.repo.UserRepository.GetByID(userID)
	if err != nil {
		fmt.Printf("failed to get user: %v\n", err)
		return
	}

	_, err = s.repo.PaymentRepository.Deposit(ctx, user, amount)
	if err != nil {
		fmt.Printf("failed to deposit %v\n", err)
		return
	}
}

func (s *PaymentService) verifyPaymentCompletion(ctx context.Context, orderID string) error {
	for attempt := 0; attempt < maxStatusAttempts; attempt++ {
		status, err := s.paypalClient.CheckOrderStatus(orderID)
		if err != nil {
			return fmt.Errorf("failed to check payment status: %w", err)
		}

		switch status {
		case "APPROVED":
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
