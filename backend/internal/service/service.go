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
}

func NewService(
	ComputerService ComputerService,
	UserService UserService,
	BookingService BookingService,
	PackageService PackageService,
) *Service {
	return &Service{
		ComputerService: ComputerService,
		UserService:     UserService,
		BookingService:  BookingService,
		PackageService:  PackageService,
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
	SendVerificationCode(dto.EmailVerificationRequest) error
	SendPasswordResetCode(email string) error
	ConfirmPasswordReset(req dto.ResetPasswordConfirm) error
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

var ErrUnhandledError = errors.New("unhandled error occured, please ask an admin to fix")
