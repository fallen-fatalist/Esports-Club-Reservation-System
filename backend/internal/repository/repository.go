package repository

import (
	"context"
	"esports_club_booking/internal/transport/dto"
	"io"
	"net/http"
	"time"

	"esports_club_booking/internal/entities"
)

type Repository struct {
	UserRepository     UserRepository
	ComputerRepository ComputerRepository
	BookingRepository  BookingRepository
	PackageRepository  PackageRepository
	PaymentRepository  PaymentRepository
}

func NewRepository(
	userRepository UserRepository,
	computerRepository ComputerRepository,
	bookingRepository BookingRepository,
	packageRepository PackageRepository,
	paymentRepository PaymentRepository,
) (*Repository, error) {
	if userRepository == nil {
		panic("User repository is nil")
	} else if computerRepository == nil {
		panic("Computer repository is nil")
	} else if bookingRepository == nil {
		panic("User repository is nil")
	} else if packageRepository == nil {
		panic("Package repository is nil")
	} else if paymentRepository == nil {
		panic("Payment repository is nil")
	}
	return &Repository{
		UserRepository:     userRepository,
		ComputerRepository: computerRepository,
		BookingRepository:  bookingRepository,
		PackageRepository:  packageRepository,
		PaymentRepository:  paymentRepository,
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
	Update(*dto.User) (int64, error)
	UpdateBalance(userID int64, amount float64) error
	UpdatePassword(userID int64, hashedPassword string) error
	Delete(int64) error
	Block(userID int64) error
	Unblock(userID int64) error
	GetVerification(email, vType string) (entities.EmailVerification, error)
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

type PaymentRepository interface {
	Deposit(ctx context.Context, user *entities.User, amout float64) (int64, error)
	PayBooking(ctx context.Context, bookingID *entities.Booking, amount float64) error
	CancelBooking(ctx context.Context, booking *entities.Booking, amount float64) error
}

type PayPalClient interface {
	Deposit(amount float64, userID int64, description string) (string, string, error)
	VerifyWebhook(ctx context.Context, r *http.Request) error
}

type MinioClient interface {
	ChangePfp(ctx context.Context, userID string, r io.Reader, objectSize int64, contentType string) error
	GetPfpURL(ctx context.Context, userID string) (string, error)
	DeletePfp(ctx context.Context, userID string) error
}
