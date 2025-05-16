package api

import (
	"context"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/repository/postgres"
	"esports_club_booking/internal/server"
	httpserver "esports_club_booking/internal/server/http"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/service/implementation"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"
)

func Run() {

	// Database connection
	db, err := postgres.OpenDB()
	if err != nil {
		log.Fatal(err)
	}
	slog.Info("Successfully connected to database")

	// Repositories init
	var userRepository repository.UserRepository
	var computerRepository repository.ComputerRepository
	var bookingRepository repository.BookingRepository
	var packageRepository repository.PackageRepository

	userRepository, _ = postgres.NewUserRepository(db)
	computerRepository, _ = postgres.NewComputerRepository(db)
	bookingRepository, _ = postgres.NewBookingRepository(db)
	packageRepository, _ = postgres.NewPackageRepository(db)

	// Services init
	var userService service.UserService
	var computerService service.ComputerService
	var bookingService service.BookingService
	var packageService service.PackageService

	userService, _ = implementation.NewUserService(userRepository)
	computerService, _ = implementation.NewComputerService(computerRepository)
	bookingService, _ = implementation.NewBookingService(bookingRepository)
	packageService, _ = implementation.NewPackageService(packageRepository)
	service, _ := service.NewService(
		computerService,
		userService,
		bookingService,
		packageService,
	)

	// Server init
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	var app server.Server
	var logger *slog.Logger = slog.New(slog.NewTextHandler(os.Stdout, nil))
	app = httpserver.NewServer(
		service,
		logger,
	)

	turnOnTimers(*service)

	mux := app.Routes()

	slog.Info("Starting server on: " + port + " port")
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), mux))
}

func turnOnTimers(service service.Service) {
	refresherTicker := time.NewTicker(1 * time.Minute)
	defer refresherTicker.Stop()

	go refresherCallback(refresherTicker, service.BookingService)

	creatorTicker := time.NewTicker(10 * time.Minute)
	defer creatorTicker.Stop()

	go generatorCallback(creatorTicker, service.BookingService)

}

func refresherCallback(ticker *time.Ticker, service service.BookingService) {
	for range ticker.C {
		service.RefreshBookings()
	}
}

func generatorCallback(ticker *time.Ticker, service service.BookingService) {
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
