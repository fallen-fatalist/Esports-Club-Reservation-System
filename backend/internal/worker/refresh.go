package worker

import (
	"context"
	"esports_club_booking/internal/service"
	"time"
)

func turnOnTimers(service service.Service) {

}

func RefresherCallback(ticker *time.Ticker, service service.BookingService) {
	for range ticker.C {
		service.RefreshBookings()
	}
}

func GeneratorCallback(ticker *time.Ticker, service service.BookingService) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	// Run in ticker
	for range ticker.C {
		for range 10 {
			select {
			case <-ctx.Done():
				cancel()
				return
			default:
				service.GenerateBooking(ctx)
			}
		}
	}

	cancel()
}
