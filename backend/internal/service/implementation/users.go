package implementation

import (
	"context"
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/config"
	"esports_club_booking/internal/email"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/transport/dto"
	"fmt"
	"log"
	"log/slog"
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

func (s *UserService) CreateUser(userDTO *dto.RegisterUser) (int64, error) {
	if err := validateEmail(userDTO.Email); err != nil {
		return -1, err
	}

	if err := validateUsername(userDTO.Login); err != nil {
		return -1, err
	}

	if err := validatePassword(userDTO.Password); err != nil {
		return -1, err
	}

	hashedPassword, err := auth.HashPassword(userDTO.Password)
	if err != nil {
		slog.Error("Error while creating owner: hashing password", slog.Any("error", err))
		return -1, err
	}

	user := entities.User{
		Login:   userDTO.Login,
		Email:   userDTO.Email,
		Status:  entities.ActiveStatus,
		Role:    entities.ClientRole,
		Balance: 0,
	}

	return s.repo.Create(&user, hashedPassword)
}

func (s *UserService) Block(userID int64, adminLogin string) error {
	if err := entities.ValidateID(userID); err != nil {
		return err
	}

	if err := s.repo.Block(userID); err != nil {
		return err
	}

	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}

	return s.emailSender.SendEmail(
		user.Email,
		"Account block",
		fmt.Sprintf("Your account has been blocked by %s, please contact support", adminLogin),
	)
}

func (s *UserService) Unblock(userID int64) error {
	if err := entities.ValidateID(userID); err != nil {
		return err
	}
	return s.repo.Unblock(userID)
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
	if err != nil {
		log.Fatal("Error while creating owner: hashing password", slog.Any("error", err))

	}

	_, err = s.repo.Create(owner, hashedPassword)
	if err != nil {
		log.Fatal("Error while creating owner in repository: ", err)
	}

	return nil
}

func (s *UserService) Delete(ctx context.Context, userID int64) error {
	if err := entities.ValidateID(userID); err != nil {
		return err
	}

	// Validate that user role not exceeds yourself
	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}

	role, roleExists := auth.GetRoleFromContext(ctx)
	if !roleExists {
		slog.Error("Error while deleting user: getting role from context", slog.Any("error", err), slog.String("role", role))
		return entities.ErrUnhandledError
	}

	if !entities.RoleHasSufficientRights(role, user.Role) {
		return entities.ErrInsufficientPriv
	}

	return s.repo.Delete(userID)
}

func (s *UserService) UserBalanceFill(ctx context.Context, userID int64, amount float64) error {
	if err := entities.ValidateID(userID); err != nil {
		return err
	}

	if amount <= entities.EPS {
		return entities.ErrNegativeOrZeroAmount
	} else if amount-entities.MAX_AMOUNT > entities.EPS {
		// TODO: validation if needed
		requesterID, _ := auth.GetUserIDFromContext(ctx)
		requesterRole, _ := auth.GetUserIDFromContext(ctx)
		slog.Warn("Maximum amount transfer exceeded", slog.String("Requester ID", requesterID), slog.String("Requester Role", requesterRole), slog.Float64("Amount", amount), slog.Int64("user id", userID))
		return entities.ErrMaximumAmount
	}

	return s.repo.UpdateBalance(userID, amount)
}

func (s *UserService) GrantAdmin(userID int64, role string) error {
	if !entities.CheckEnumUserRole(role) {
		return entities.ErrIncorrectRole
	}

	if err := entities.ValidateID(userID); err != nil {
		return err
	}
	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}
	user.Role = entities.AdminRole
	userDTO := dto.User{
		Email:    user.Email,
		Username: user.Login,
		Status:   user.Status,
		Balance:  user.Balance,
		Role:     role,
	}
	_, err = s.repo.Update(&userDTO)
	return err
}
