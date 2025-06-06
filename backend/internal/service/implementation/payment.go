package implementation

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"time"

	"esports_club_booking/internal/email"
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
	emailSender  email.EmailSender
	repo         repository.Repository
}

func NewPaymentService(client *paypal.PayPalClient, emailSender email.EmailSender, repo repository.Repository) *PaymentService {
	return &PaymentService{
		paypalClient: client,
		emailSender:  emailSender,
		repo:         repo,
	}
}

func (s *PaymentService) RequestDeposit(ctx context.Context, userID int64, amount float64) (string, string, error) {
	user, err := s.repo.UserRepository.GetByID(userID)
	if err != nil {
		return "", "", fmt.Errorf("couldn't fetch user by id %w", err)
	}

	orderID, redirectURL, err := s.paypalClient.Deposit(amount, user.ID, "Deposit to your account")
	if err != nil {
		return "", "", fmt.Errorf("paypal deposit failed: %w", err)
	}

	return orderID, redirectURL, nil
}

func (s *PaymentService) Deposit(ctx context.Context, userID int64, amount float64) error {
	user, err := s.repo.UserRepository.GetByID(userID)
	if err != nil {
		return err
	}

	err = s.emailSender.SendEmail(
		user.Email,
		"Balance changes",
		fmt.Sprintf("Your balance has increased by %.2f", amount),
	)

	if err != nil {
		log.Printf("failed to send balance update email to %s: %v", user.Email, err)
	}
	_, err = s.repo.PaymentRepository.Deposit(ctx, user, amount)
	return err
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

	err = s.repo.PaymentRepository.PayBooking(ctx, booking, packageItem.Price)
	if err != nil {
		return fmt.Errorf("failed to pay booking: %w", err)
	}

	// Send confirmation email
	err = s.emailSender.SendEmail(
		user.Email,
		"Booking Confirmation",
		fmt.Sprintf("Your booking for %s has been confirmed.", packageItem.Name),
	)
	if err != nil {
		slog.Error("failed to send booking confirmation email", "error", err)
	}

	return nil
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

	user, err := s.repo.UserRepository.GetByID(booking.UserID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	err = s.emailSender.SendEmail(
		user.Email,
		"Booking Confirmation",
		fmt.Sprintf("Your booking for %s has been confirmed.", packageItem.Name),
	)
	if err != nil {
		slog.Error("failed to send booking confirmation email", "error", err)
	}

	return s.repo.PaymentRepository.CancelBooking(ctx, booking, packageItem.Price)
}

func (s *PaymentService) VerifyWebhook(ctx context.Context, r *http.Request) error {
	return s.paypalClient.VerifyWebhook(ctx, r)
}
