package worker

import (
	"fmt"
	"log/slog"
	"time"

	"esports_club_booking/internal/email"
	"esports_club_booking/internal/service"
)

type NotificationSender struct {
	Svc         service.Service
	EmailSender email.EmailSender
	// TelegramSender telegram.Sender -- further implementation
	logger *slog.Logger
}

func NewNotificationSender(svc service.Service, emailSender email.EmailSender, logger *slog.Logger) NotificationSender {
	return NotificationSender{
		Svc:         svc,
		EmailSender: emailSender,
		logger:      logger,
	}
}

// RunBookingNotification starts worker that sends notification 15 mins prior to the booking.
// Run this method in a goroutine.
func (w NotificationSender) RunBookingNotification(ticker *time.Ticker) {
	for range ticker.C {
		bookings, err := w.Svc.BookingService.GetBookingsBeforeStartTime()
		if err != nil {
			w.logger.Warn("get active bookings", "error", err)
			continue
		}

		for _, booking := range bookings {
			if booking.IsNotified {
				continue
			}

			if err := w.Svc.BookingService.BookingNotified(booking); err != nil {
				w.logger.Warn("booking notified", "error", err, "id", booking.UserID)
				continue
			}

			user, err := w.Svc.UserService.GetUser(booking.UserID)
			if err != nil {
				w.logger.Warn("get user by id", "error", err, "id", booking.UserID)
				continue
			}

			msg, err := humanMsg(booking.StartTime)
			if err != nil {
				w.logger.Warn("human msg", "error", err, "id", booking.UserID)
				continue
			}

			err = w.EmailSender.SendEmail(
				user.Email,
				"Booking reminder",
				msg,
			)
			if err != nil {
				w.logger.Warn("send email", "email", user.Email, "error", err)
				continue
			}
		}

	}
}

func humanMsg(startRFC string) (string, error) {
	start, err := time.Parse(time.RFC3339, startRFC)
	if err != nil {
		return "", err
	}

	// Use fixed offset instead of location
	start = start.Add(6 * time.Hour) // +06:00 for Almaty

	diff := time.Until(start)
	mins := int(diff.Minutes())
	if mins < 0 {
		mins = 0
	}

	return fmt.Sprintf("%d minutes left before your booking at %s",
		mins, start.Format("Jan 2, 2006 at 3:04 PM")), nil
}
