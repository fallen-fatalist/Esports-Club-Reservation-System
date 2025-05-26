package implementation

import (
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/config"
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

func NewUserService(
	ownerCredentials *config.OwnerCredentials,
	repository repository.UserRepository,
	jwtManager auth.JWTManager,
	emailSender email.EmailSender,
) (*UserService, error) {
	if repository == nil {
		log.Fatal("Nil repository provided to user service")
	} else if jwtManager == nil {
		log.Fatal("Nil jwt manager provided to user service")
	} else if ownerCredentials == nil {
		log.Fatal("Nil config provided to user service")
	}

	svc := &UserService{repository, jwtManager, emailSender}
	if err := svc.createOwner(ownerCredentials); err != nil {
		log.Fatal(":", err)
	}

	return svc, nil
}

func (s *UserService) GetUsers() ([]*entities.User, error) {
	return s.repo.GetAll()
}

func (s *UserService) GetUser(id int64) (*entities.User, error) {
	if err := entities.ValidateID(id); err != nil {
		return nil, err
	}

	user, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, entities.ErrUserNotFound
	}

	return user, nil
}

func (s *UserService) CreateUser(user *entities.User) (int64, error) {
	// s.repo.Create(usefr, user.HashedPassword)
	return 0, nil
}

func (s *UserService) createOwner(ownerCredentials *config.OwnerCredentials) error {
	// TODO: optimize the owner check
	users, err := s.GetUsers()
	if err != nil {
		log.Fatal("Error while creating owner: fetching users", err)
	}

	for _, user := range users {
		if user.Role == entities.OwnerRole {
			return nil
		}
	}

	owner := &entities.User{
		Login:   ownerCredentials.Username,
		Email:   ownerCredentials.Email,
		Status:  entities.ActiveStatus,
		Role:    entities.OwnerRole,
		Balance: 100000,
	}

	hashedPassword, err := auth.HashPassword(ownerCredentials.Password)

	_, err = s.repo.Create(owner, hashedPassword)
	if err != nil {
		log.Fatal("Error while creating owner in repository: ", err)
	}

	return nil
}
