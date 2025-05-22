package worker

import (
	"context"
	"time"

	"esports_club_booking/internal/service"
)

func RefresherCallback(ticker *time.Ticker, service service.BookingService) {
	for range ticker.C {
		service.RefreshBookings()
	}
}

func GeneratorCallback(ticker *time.Ticker, service service.BookingService) {
	for range 5 {
		service.GenerateBooking(context.Background())
	}

	// Run in ticker
	for range ticker.C {
		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
		service.GenerateBooking(ctx)
		cancel()
	}
}
