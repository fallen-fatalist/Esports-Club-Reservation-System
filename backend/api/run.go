package api

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/config"
	"esports_club_booking/internal/email"
	"esports_club_booking/internal/repository/postgres"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/service/implementation"
	"esports_club_booking/internal/transport/httpserver"
	"esports_club_booking/internal/transport/httpserver/handlers"
	"esports_club_booking/internal/worker"
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
	emailSender := email.NewEmailSender(cfg.EmailSender.FromAddress, cfg.EmailSender.Password,
		cfg.EmailSender.SMTPHost, int(cfg.EmailSender.SMTPPort))

	userService, _ := implementation.NewUserService(userRepository, jwtManager, emailSender)
	computerService, _ := implementation.NewComputerService(computerRepository)
	packageService, _ := implementation.NewPackageService(packageRepository)

	// Fetch the number of computers
	var computerNum int
	computers, err := computerService.GetAllComputers()
	if err == nil {
		computerNum = len(computers)
	}
	// Set the number of computers
	bookingService, _ := implementation.NewBookingService(bookingRepository, packageService, computerNum)

	svc := service.NewService(
		computerService,
		userService,
		bookingService,
		packageService,
	)

	// workers
	startWorkers(*svc, ctx, emailSender, logger)

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

func startWorkers(svc service.Service, ctx context.Context, emailSender email.EmailSender, logger *slog.Logger) {
	refresherTicker := time.NewTicker(1 * time.Minute)
	go worker.RefresherCallback(refresherTicker, svc.BookingService)

	creatorTicker := time.NewTicker(30 * time.Minute)
	go worker.GeneratorCallback(creatorTicker, svc.BookingService)

	cleanupTicker := time.NewTicker(time.Minute)
	go worker.StartUserCleanupWorker(cleanupTicker, ctx, svc.UserService)

	notificationTicker := time.NewTicker(30 * time.Second)
	notificationWorker := worker.NewNotificationSender(svc, emailSender, logger)
	go notificationWorker.RunBookingNotification(notificationTicker)
}
