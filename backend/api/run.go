package api

import (
	"context"
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/config"
	"esports_club_booking/internal/email"
	"esports_club_booking/internal/repository/postgres"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/service/implementation"
	"esports_club_booking/internal/transport/httpserver"
	"esports_club_booking/internal/transport/httpserver/handlers"
	"esports_club_booking/internal/worker"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"
)

func Run() {
	// err := godotenv.Load()
	// if err != nil {
	// 	log.Fatal("Error loading .env file")
	// }
	// Load the configuration
	cfg := config.NewConfig()

	// Initialize the logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

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
	jwtManager := auth.NewJWTManager(cfg.JWT.Secret, cfg.JWT.Expiration)
	emailSender := email.NewEmailSender(cfg.EmailSender.FromAddress, cfg.EmailSender.Password, cfg.EmailSender.SMTPHost, int(cfg.EmailSender.SMTPPort))

	userService, _ := implementation.NewUserService(userRepository, jwtManager, emailSender)
	computerService, _ := implementation.NewComputerService(computerRepository)
	packageService, _ := implementation.NewPackageService(packageRepository)

<<<<<<< HEAD
	svc := service.NewService(computerService, userService, bookingService, packageService)

	// workers
	startWorkers(*svc, ctx)
=======
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
>>>>>>> d2baa29de07debb9e10b2af11cef6f0c1db7ad21

	// Set the number of computers

	mux := http.NewServeMux()
	handlers := handlers.NewHandler(svc, logger, jwtManager)
	handlers.RegisterEndpoints(mux)

	address := fmt.Sprintf("%s:%s", cfg.Server.Adress, cfg.Server.Port)
	srv := httpserver.NewServer(mux, logger, address)

	if err := srv.Start(); err != nil {
		logger.Error("Failed to start server", slog.Any("error", err))
		return
	}

}

<<<<<<< HEAD
func startWorkers(svc service.Service, ctx context.Context) {
	refresherTicker := time.NewTicker(1 * time.Minute)
	defer refresherTicker.Stop()
	go worker.RefresherCallback(refresherTicker, svc.BookingService)

	creatorTicker := time.NewTicker(10 * time.Minute)
	defer creatorTicker.Stop()
	go worker.GeneratorCallback(creatorTicker, svc.BookingService)

	cleanupTicker := time.NewTicker(time.Minute)
	defer cleanupTicker.Stop()
	go worker.StartUserCleanupWorker(ctx, svc.UserService)
=======
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
>>>>>>> d2baa29de07debb9e10b2af11cef6f0c1db7ad21
}
