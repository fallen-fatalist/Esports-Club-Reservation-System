package api

import (
	"context"
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
	packageService, _ := implementation.NewPackageService(packageRepository)

	// Fetch the number of computers
	var computerNum int
	computers, err := computerService.GetAllComputers()
	if err == nil {
		computerNum = len(computers)
	}
	bookingService, _ := implementation.NewBookingService(bookingRepository, computerNum)

	svc := service.NewService(
		computerService,
		userService,
		bookingService,
		packageService,
	)

	// Set the number of computers

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
	refresherTicker := time.NewTicker(10 * time.Second)
	go refresherCallback(refresherTicker, service.BookingService)

	creatorTicker := time.NewTicker(10 * time.Minute)
	go generatorCallback(creatorTicker, service.BookingService)
}

func refresherCallback(ticker *time.Ticker, service service.BookingService) {
	for range ticker.C {
		service.RefreshStatus()
	}
}

func generatorCallback(ticker *time.Ticker, service service.BookingService) {
	// Run in ticker
	for range ticker.C {
		service.GenerateBooking(context.Background())
	}
}
