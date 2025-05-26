package repository

import (
	"context"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository/postgres"
	"time"
)

type Repository struct {
	UserRepository     UserRepository
	ComputerRepository ComputerRepository
	BookingRepository  BookingRepository
}

func NewRepository(
	userRepository UserRepository,
	computerRepository ComputerRepository,
	bookingRepository BookingRepository,

) (*Repository, error) {
	if userRepository == nil {
		panic("User repository is nil")
	} else if computerRepository == nil {
		panic("Computer repository is nil")
	} else if bookingRepository == nil {
		panic("User repository is nil")
	}
	return &Repository{
		UserRepository:     userRepository,
		ComputerRepository: computerRepository,
		BookingRepository:  bookingRepository,
	}, nil
}

type UserRepository interface {
	GetAll() ([]*entities.User, error)
	GetByID(int64) (*entities.User, error)
	GetByEmail(email string) (entities.User, error)
	GetByLogin(email string) (entities.User, error)
	GetCredentialsByEmail(email string) (entities.UserCredentials, error)
	GetCredentialsByLogin(login string) (entities.UserCredentials, error)
	Create(entity *entities.User, hashedPassword string) (int64, error)
	Update(*entities.Booking) (int64, error)
	UpdatePassword(userID int64, hashedPassword string) error
	Delete(int64) error
	GetVerification(email, vType string) (postgres.EmailVerification, error)
	SaveVerification(email, code, vType string, expiresAt time.Time) error
	MarkEmailVerified(userID int64) error
	BlockEmail(email, typ string, duration time.Duration) error
	IncrementAttempt(email, typ string) error
	DeleteVerification(email, vType string) error
	DeleteUnverifiedUsers(olderThan time.Time) error
}

type ComputerRepository interface {
	GetAll() ([]*entities.Computer, error)
	GetByID(int64) (*entities.Computer, error)
	Create(*entities.Computer) (int64, error)
	Update(*entities.Computer) (int64, error)
	Delete(int64) (int64, error)
}

type BookingRepository interface {
	GetAll() ([]*entities.Booking, error)
	GetAllByUserID(int64) ([]*entities.Booking, error)
	GetByID(int64) (*entities.Booking, error)
	Create(context.Context, *entities.Booking) (int64, error)
	Update(booking *entities.Booking) (int64, error)
	Delete(int64) error
	Cancel(int64) error
	/* Very bad and stupid solution must be optimized to priority queue */
	RefreshBookings()
}

type PackageRepository interface {
	GetAll() ([]*entities.Package, error)
	GetByID(int64) (*entities.Package, error)
	Create(*entities.Package) (int64, error)
	Update(*entities.Package) (int64, error)
	Delete(int64) error
}
