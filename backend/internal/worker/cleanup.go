package worker

import (
	"context"
	"esports_club_booking/internal/service"
	"log"
	"time"
)

func StartUserCleanupWorker(ctx context.Context, userService service.UserService) {
	ticker := time.NewTicker(time.Minute)

	go func() {
		for {
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
	}()

}
