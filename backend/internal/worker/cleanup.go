package worker

import (
	"context"
	"esports_club_booking/internal/service"
	"log"
	"time"
)

func StartUserCleanupWorker(ticker *time.Ticker, ctx context.Context, userService service.UserService) {
	for range ticker.C {
		select {
		case <-ctx.Done():
			ticker.Stop()
			return
		case <-ticker.C:
			err := userService.DeleteUnverifiedUsers()
			if err != nil {
				log.Print(err)
			}
		}
	}
}
