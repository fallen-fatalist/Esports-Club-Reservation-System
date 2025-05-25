package worker

import (
	"time"

	"esports_club_booking/internal/service"
)

func RefresherCallback(ticker *time.Ticker, service service.BookingService) {
	for range ticker.C {
		service.RefreshBookings()
	}
}
