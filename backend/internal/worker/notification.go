package worker

import (
	"fmt"
	"log/slog"
	"time"

	"esports_club_booking/internal/email"
	"esports_club_booking/internal/service"
)

type NotificationSender struct {
	BookingSvc  service.BookingService
	UserSvc     service.UserService
	EmailSender email.EmailSender
	// TelegramSender telegram.Sender -- further implementation
	logger *slog.Logger
}

func NewNotificationSender(bookingSvc service.BookingService, userSvc service.UserService, emailSender email.EmailSender, logger *slog.Logger) *NotificationSender {
	return &NotificationSender{
		BookingSvc:  bookingSvc,
		UserSvc:     userSvc,
		EmailSender: emailSender,
		logger:      logger,
	}
}

// RunBookingNotification starts worker that sends notification 15 mins prior to the booking.
// Run this method in a goroutine.
func (w *NotificationSender) RunBookingNotification(ticker *time.Ticker) {
	for range ticker.C {
		bookings, err := w.BookingSvc.GetPendingBookings()
		if err != nil {
			w.logger.Warn("get active bookings", "error", err)
			continue
		}

		for _, booking := range bookings {
			if booking.IsNotified {
				continue
			}

			if err := w.BookingSvc.BookingNotified(booking); err != nil {
				w.logger.Warn("booking notified", "error", err, "id", booking.UserID)
				continue
			}

			user, err := w.UserSvc.GetUser(booking.UserID)
			if err != nil {
				w.logger.Warn("get user by id", "error", err, "id", booking.UserID)
				continue
			}

			err = w.EmailSender.SendEmail(
				user.Email,
				"Booking reminder",
				fmt.Sprintf("15 minutes left before your booking at %s", booking.StartTime),
			)
			if err != nil {
				w.logger.Warn("send email", "email", user.Email, "error", err)
				continue
			}
		}

	}
}
