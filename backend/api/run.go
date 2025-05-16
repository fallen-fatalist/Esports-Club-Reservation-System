package api

import (
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/config"
	"esports_club_booking/internal/repository/postgres"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/service/implementation"
	"esports_club_booking/internal/transport/httpserver"
	"esports_club_booking/internal/transport/httpserver/handlers"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"
)

func Run() {
	// Load the configuration
	cfg := config.NewConfig()

	// Initialize the logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// Database connection
	db, err := postgres.OpenDB(cfg.DataBase)
	if err != nil {
		log.Fatal(err)
	}
	slog.Info("Successfully connected to database")

	// Repositories init

	userRepository, _ := postgres.NewUserRepository(db)
	computerRepository, _ := postgres.NewComputerRepository(db)
	bookingRepository, _ := postgres.NewBookingRepository(db)
	packageRepository, _ := postgres.NewPackageRepository(db)

	// Services init
	jwtManager := auth.NewJWTManager(cfg.JWTConfig.Secret, cfg.JWTConfig.Expiration)
	userService, _ := implementation.NewUserService(userRepository, jwtManager)
	computerService, _ := implementation.NewComputerService(computerRepository)
	bookingService, _ := implementation.NewBookingService(bookingRepository)
	packageService, _ := implementation.NewPackageService(packageRepository)
	svc := service.NewService(
		computerService,
		userService,
		bookingService,
		packageService,
	)

	mux := http.NewServeMux()
	handlers := handlers.NewHandler(svc, logger, jwtManager)
	handlers.RegisterEndpoints(mux)

	address := fmt.Sprintf("%s:%s", cfg.Server.Adress, cfg.Server.Port)
	srv := httpserver.NewServer(mux, logger, address)

	turnOnTimers(*svc)

	if err := srv.Start(); err != nil {
		logger.Error("Failed to start server", slog.Any("error", err))
		return
	}

}

func turnOnTimers(service service.Service) {
	refresherTicker := time.NewTicker(1 * time.Minute)
	defer refresherTicker.Stop()

	go refresher(refresherTicker, service.BookingService)

	creatorTicker := time.NewTicker(10 * time.Minute)
	defer creatorTicker.Stop()

	for range 10 {
		service.BookingService.GenerateBooking()
	}

	go bookingCreator(creatorTicker, service.BookingService)

}

func refresher(ticker *time.Ticker, service service.BookingService) {
	for range ticker.C {
		service.RefreshBookings()
	}
}

func bookingCreator(ticker *time.Ticker, service service.BookingService) {
	for range ticker.C {
		for range 10 {
			service.GenerateBooking()
		}
	}
}
