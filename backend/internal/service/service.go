package service

import (
	"context"
	"errors"

	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
)

type Service struct {
	ComputerService ComputerService
	UserService     UserService
	BookingService  BookingService
	PackageService  PackageService
	PaymentService  PaymentService
}

func NewService(
	ComputerService ComputerService,
	UserService UserService,
	BookingService BookingService,
	PackageService PackageService,
	PaymentService PaymentService,
) *Service {
	return &Service{
		ComputerService: ComputerService,
		UserService:     UserService,
		BookingService:  BookingService,
		PackageService:  PackageService,
		PaymentService:  PaymentService,
	}
}

type ComputerService interface {
	ComputersMap() map[int64]*entities.Computer
	GetAllComputers() ([]*entities.Computer, error)
	GetComputer(id int64) (*entities.Computer, error)
	CreateComputer(*entities.Computer) (int64, error)
	DeleteComputer(id int64) error
	GetAllComputerStatuses() ([]*entities.ComputerStatus, error)
	GetComputerStatus(id int64) (*entities.ComputerStatus, error)
}

type UserService interface {
	GetAllUsers() ([]*entities.User, error)
	GetUser(int64) (*entities.User, error)
	CreateUser(*entities.User) (int64, error)
	// AuthUser()
	Register(userDTO dto.RegisterUser) (int64, error)
	Login(userDTO dto.LoginUser) (string, error)
	VerifyEmail(emailverify dto.VerifyEmailRequest) error
	SendVerificationCode(dto.VerificationRequest) error
	DeleteUnverifiedUsers() error
	// FillBalance()
}

type BookingService interface {
	// BookingNotified(*entities.Booking)
	GetAllBookings() ([]*entities.Booking, error)
	CreateBooking(context.Context, *entities.Booking) (int64, error)
	BookingNotified(*entities.Booking) error
	GetComputerBookings(id int64) ([]*entities.Booking, error)
	UserBookings(id int64) ([]*entities.Booking, error)
	GetBooking(id int64) (*entities.Booking, error)
	GetActiveBookings() ([]*entities.Booking, error)
	GetPendingBookings() ([]*entities.Booking, error)
	GetFinishedBookings() ([]*entities.Booking, error)
	GetCancelledBookings() ([]*entities.Booking, error)
	GetComputersLeftOccupiedTime(packageID int64) ([]*entities.ComputerOccupiedLeftTime, error)
	GetComputerLeftOccupiedTime(computerID int64, packageID int64) (*entities.ComputerOccupiedLeftTime, error)
	GetBookingsBeforeStartTime() ([]*entities.Booking, error)
	RefreshBookings()
}

type PackageService interface {
	Packages() ([]*entities.Package, error)
	PackagesMap() map[int64]*entities.Package
	GetPackage(id int64) (*entities.Package, error)
	CreatePackage(*entities.Package) (int64, error)
	UpdatePackage(*entities.Package) (int64, error)
	DeletePackage(int64) error
}

type PaymentService interface {
	PayBooking(context.Context, int64) error
	CancelBooking(context.Context, int64) error
	Deposit(context.Context, int64, float64) (orderID string, redirectURL string, err error)
	VerifyDeposit(ctx context.Context, userID int64, amount float64, orderID string) error

	// Further do
	// Withdraw(context.Context, *entities.User) (string, error)
	// GetTransactionHistory(context.Context, *entities.User) ([]*entities.Transaction, error)
	// GetBalance(context.Context, *entities.User) (float64, error)
	//
}

var ErrUnhandledError = errors.New("unhandled error occurred, please ask an admin to fix")
