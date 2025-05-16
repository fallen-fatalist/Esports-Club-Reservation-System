package implementation

import (
	"errors"
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/transport/dto"
	"fmt"
	"log"
	"strconv"
)

type UserService struct {
	repo repository.UserRepository
	jwt  auth.JWTManager
}

func NewUserService(repository repository.UserRepository, jwtManager auth.JWTManager) (*UserService, error) {
	if repository == nil {
		log.Fatal("Nil repository provided to user service")
	}
	return &UserService{repository, jwtManager}, nil
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

func (s *UserService) Register(userDTO dto.RegisterUser) (int64, error) {
	// check if user already exists
	const op = "service.RegisterUser"
	_, err := s.repo.GetByEmail(userDTO.Email)
	if err == nil {
		return -1, service.ErrUserAlreadyExists
	} else if !errors.Is(err, service.ErrUserNotFound) {
		return -1, fmt.Errorf("%s: failed to check existing user: %w", op, err)
	}

	// hash password
	hashedPassword, err := auth.HashPassword(userDTO.Password)
	if err != nil {
		return -1, fmt.Errorf("%s: failed to hash password: %w", op, err)
	}

	// create user instance
	user := entities.User{
		ID:     -1, // if user id didnt change then repository layer is not doing its job
		Login:  userDTO.Login,
		Email:  userDTO.Email,
		Role:   "client",
		Status: "active",
	}

	// call create register method to register new user
	_, err = s.repo.Create(&user, hashedPassword)
	if err != nil {
		return -1, fmt.Errorf("%s: failed to create user: %w", op, err)
	}

	return user.ID, nil
}

func (s *UserService) Login(userDTO dto.LoginUser) (string, error) {
	const op = "service.LoginUser"
	// look up the user from database to take the  password
	// get user by email from the database in order to get password
	user, err := s.repo.GetCredentialsByEmail(userDTO.Email)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return "", errors.New("invalid email or password")
		}
		return "", fmt.Errorf("%s: failed to fetch user: %w", op, err)
	}

	// compare passwords from request and database
	if !auth.VerifyPassword(user.HashedPassword, userDTO.Password) {
		return "", errors.New("invalid email or password")
	}

	//generate jwt token and sign it (auth.CreateJWT already signs it for you)
	userIDstr := strconv.Itoa(user.ID)
	tokenString, err := s.jwt.CreateToken(userIDstr, user.Role)
	if err != nil {
		return "", fmt.Errorf("%s: failed to generate JWT token: %w", op, err)
	}

	return tokenString, nil
}
