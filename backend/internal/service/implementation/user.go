package implementation

import (
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/email"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"log"
)

type UserService struct {
	repo        repository.UserRepository
	jwt         auth.JWTManager
	emailSender email.EmailSender
}

func NewUserService(repository repository.UserRepository, jwtManager auth.JWTManager, emailSender email.EmailSender) (*UserService, error) {
	if repository == nil {
		log.Fatal("Nil repository provided to user service")
	}
	return &UserService{repository, jwtManager, emailSender}, nil
}

func (s *UserService) GetAllUsers() ([]*entities.User, error) {
	return nil, nil
}

func (s *UserService) GetUser(id int64) (*entities.User, error) {
	if err := entities.ValidateID(id); err != nil {
		return nil, err
	}

	return nil, nil
}

func (s *UserService) CreateUser(user *entities.User) (int64, error) {
	return 0, nil
}
