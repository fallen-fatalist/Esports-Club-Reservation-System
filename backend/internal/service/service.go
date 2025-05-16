package service

import (
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
	//AuthUser()
	Register(userDTO dto.RegisterUser) (int64, error)
	Login(userDTO dto.LoginUser) (string, error)
	//FillBalance()

}

type BookingService interface {
	GetAllBookings() ([]*entities.Booking, error)
	CreateBooking(*entities.Booking) (int64, error)
	GetComputerBookings(id int64) ([]*entities.Booking, error)
	GetActiveBookings() ([]*entities.Booking, error)
	GetPendingBookings() ([]*entities.Booking, error)
	GetFinishedBookings() ([]*entities.Booking, error)
	GetCancelledBookings() ([]*entities.Booking, error)
	GetComputersLeftOccupiedTime() ([]*entities.ComputerOccupiedLeftTime, error)
	GetComputerLeftOccupiedTime(id int64) (*entities.ComputerOccupiedLeftTime, error)
	RefreshBookings()
	GenerateBooking()
}

type PackageService interface {
	GetAllPackages() ([]*entities.Package, error)
	GetPackage(id int64) (*entities.Package, error)
	CreatePackage(*entities.Package) (int64, error)
	UpdatePackage(*entities.Package) (int64, error)
	DeletePackage(int64) error
}

var (
	ErrUnhandledError = errors.New("unhandled error occured, please ask an admin to fix")
)
