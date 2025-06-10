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
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/repository/email"
	exchangerateapi "esports_club_booking/internal/repository/exchangerateAPI"
	"esports_club_booking/internal/repository/paypal"
	"esports_club_booking/internal/repository/postgres"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/service/implementation"
	"esports_club_booking/internal/transport/httpserver"
	"esports_club_booking/internal/transport/httpserver/handlers"
	"esports_club_booking/internal/worker"
)

func Run() {
	// err := godotenv.Load("")
	// if err != nil {
	// 	log.Fatal("Error loading .env file")
	// }
	// Parse the envir`onment flag
	// Load .env only if in development mode
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
	paymentRepository, _ := postgres.NewPaymentRepository(db)

	// Services init
	jwtManager := auth.NewJWTManager(cfg.JWT.Secret, cfg.JWT.Expiration)
	emailSender := email.NewEmailSender(cfg.EmailSender.FromAddress, cfg.EmailSender.Password,
		cfg.EmailSender.SMTPHost, int(cfg.EmailSender.SMTPPort))
	exchangeAPI := exchangerateapi.NewExchangeRateAPI(cfg.ExchangeAPI.APIKey)

	// User service
	userService, _ := implementation.NewUserService(&cfg.OwnerCredentials, userRepository, jwtManager, emailSender)

	computerService, _ := implementation.NewComputerService(computerRepository)
	packageService, _ := implementation.NewPackageService(packageRepository)

	// Set the number of computers
	bookingService, _ := implementation.NewBookingService(
		bookingRepository,
		computerService,
		packageService,
		userService,
		emailSender,
	)

	paypalClient, err := paypal.NewPayPalClient(cfg)
	if err != nil {
		logger.Error("Failed to create PayPal client", slog.Any("error", err))
		return
	}

	paymentService := implementation.NewPaymentService(
		paypalClient,
		emailSender,
		repository.Repository{
			BookingRepository:  bookingRepository,
			UserRepository:     userRepository,
			PackageRepository:  packageRepository,
			ComputerRepository: computerRepository,
			PaymentRepository:  paymentRepository,
		},
	)

	svc := service.NewService(
		computerService,
		userService,
		bookingService,
		packageService,
		paymentService,
	)

	// workers
	startWorkers(*svc, ctx, emailSender, logger)

	mux := http.NewServeMux()
	handlers := handlers.NewHandler(svc, logger, jwtManager, exchangeAPI)
	handlers.RegisterEndpoints(mux)

	cfg.Server.Address = fmt.Sprintf("%s:%s", cfg.Server.Address, cfg.Server.Port)
	srv := httpserver.NewServer(mux, logger, cfg.Server)

	if err := srv.Start(); err != nil {
		logger.Error("Failed to start server", slog.Any("error", err))
		return
	}
}

func startWorkers(svc service.Service, ctx context.Context, emailSender email.EmailSender, logger *slog.Logger) {
	refresherTicker := time.NewTicker(1 * time.Minute)
	go worker.RefresherCallback(refresherTicker, svc.BookingService)

	cleanupTicker := time.NewTicker(time.Second * 30)
	go worker.StartUserCleanupWorker(cleanupTicker, ctx, svc.UserService)

	notificationTicker := time.NewTicker(30 * time.Second)
	notificationWorker := worker.NewNotificationSender(svc, emailSender, logger)
	go notificationWorker.RunBookingNotification(notificationTicker)
}
