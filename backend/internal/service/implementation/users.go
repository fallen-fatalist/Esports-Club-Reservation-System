package implementation

import (
	"context"
	"errors"
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/config"
	"esports_club_booking/internal/email"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/transport/dto"
	"esports_club_booking/internal/utils"
	"fmt"
	"log"
	"log/slog"
	"strconv"
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

func (s *UserService) Block(ctx context.Context, userID int64) error {
	if err := entities.ValidateID(userID); err != nil {
		return err
	}

	requesterIDStr, _ := auth.GetUserIDFromContext(ctx)
	requesterID, err := strconv.ParseInt(requesterIDStr, 10, 64)
	// Lie to the client who is trying to brute force the token
	if err != nil {
		return entities.ErrMissingToken
	}

	requester, err := s.GetUser(requesterID)
	if err != nil {
		if errors.Is(err, entities.ErrUserNotFound) {
			return err
		}
		slog.Error("Error while blocking user: getting requester", slog.Any("error", err))
		return entities.ErrUnhandledError
	}
	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}

	if requester.ID == userID {
		return entities.ErrBlockYourself
	} else if !entities.RoleHasSufficientRightsToBlock(requester.Role, user.Role) {
		return entities.ErrBlockInsufficientPriviliges
	}

	if err := s.repo.Block(userID); err != nil {
		return err
	}

	message := fmt.Sprintf(
		`Hello %s,

Your account (username: %s) has been *blocked* by administrator %s due to a policy or security reason.

You will no longer be able to access your account until the block is reviewed and lifted.

If you believe this action was taken in error or wish to appeal the decision, please contact our support team with your account details.

— eReserve Team`,
		user.Login,
		user.Login,
		requester.Login,
	)

	if err := s.emailSender.SendEmail(
		user.Email,
		"Account block",
		message,
	); err != nil {
		slog.Error("Error while blocking user: sending email", slog.Any("error", err), slog.Any("user", user), slog.Any("requester", requester))
	}

	return nil

}

func (s *UserService) Unblock(ctx context.Context, userID int64) error {
	if err := entities.ValidateID(userID); err != nil {
		return err
	}

	requesterIDStr, _ := auth.GetUserIDFromContext(ctx)
	requesterID, err := strconv.ParseInt(requesterIDStr, 10, 64)
	// Lie to the client who is trying to brute force the token
	if err != nil {
		return entities.ErrMissingToken
	}

	requester, err := s.GetUser(requesterID)
	if err != nil {
		if errors.Is(err, entities.ErrUserNotFound) {
			return err
		}
		slog.Error("Error while blocking user: getting requester", slog.Any("error", err))
		return entities.ErrUnhandledError
	}

	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}

	if requester.ID == userID {
		return entities.ErrUnBlockYourself
	} else if !entities.RoleHasSufficientRightsToBlock(requester.Role, user.Role) {
		return entities.ErrUnBlockInsufficientPriviliges
	}

	if err := s.repo.Unblock(userID); err != nil {
		return err
	}

	message := fmt.Sprintf(
		`Hello %s,

Your account (username: %s), which was previously blocked, has now been *unblocked* by administrator %s.

You may now log in and continue using our platform as usual. Please ensure that all activity on your account complies with our platform policies.

If you have any questions or believe this action was taken in error, feel free to contact our support team.

— eReserve Team`,
		user.Login,
		user.Login,
		requester.Login,
	)

	if err := s.emailSender.SendEmail(
		user.Email,
		"Account unblock",
		message,
	); err != nil {
		slog.Error("while ublocking user: sending email", slog.Any("error", err), slog.Any("user", user), slog.Any("requester", requester))
	}

	return nil
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

	requesterRole, roleExists := auth.GetRoleFromContext(ctx)
	if !roleExists {
		slog.Error("Error while deleting user: getting role from context", slog.Any("error", err), slog.String("role", requesterRole))
		return entities.ErrUnhandledError
	}

	if !entities.RoleHasSufficientRightsToDelete(requesterRole, user.Role) {
		return entities.ErrInsufficientPriv
	}

	return s.repo.Delete(userID)
}

func (s *UserService) UserBalanceCredit(ctx context.Context, userID int64, amount float64) error {
	if err := entities.ValidateID(userID); err != nil {
		return err
	}

	requesterRole, roleExists := auth.GetRoleFromContext(ctx)
	if !roleExists {
		slog.Error("Error while deleting user: getting role from context", slog.String("role", requesterRole))
		return entities.ErrUnhandledError
	}

	requesterIDStr, requesterExists := auth.GetUserIDFromContext(ctx)
	if !requesterExists {
		slog.Error("getting requester id from context", slog.String("requester id", requesterIDStr))
		return entities.ErrUnhandledError
	}
	requesterID, err := strconv.ParseInt(requesterIDStr, 10, 64)
	if err != nil {
		return entities.ErrNonNumericID
	}

	requesterUser, err := s.repo.GetByID(requesterID)
	if err != nil {
		return err
	}

	if amount-entities.MAX_AMOUNT > entities.EPS {
		// TODO: validation if needed
		requesterID, _ := auth.GetUserIDFromContext(ctx)
		requesterRole, _ := auth.GetUserIDFromContext(ctx)
		slog.Warn("Maximum amount transfer exceeded", slog.String("Requester ID", requesterID), slog.String("Requester Role", requesterRole), slog.Float64("Amount", amount), slog.Int64("user id", userID))
		return entities.ErrMaximumAmount
	}

	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}

	if !entities.RequesterMorePriviliged(requesterRole, user.Role) {
		return entities.ErrCreditInsufficientPriviliges
	}

	if user.Balance+amount >= entities.MAX_BALANCE {
		return entities.ErrUserMaxBalance
	}

	if user.Balance+amount > entities.MAX_BALANCE {
		amount = entities.MAX_BALANCE - user.Balance
	} else if user.Balance+amount <= entities.EPS {
		amount = user.Balance
	}

	message := fmt.Sprintf(
		`Dear %s,

This is an official notification that your account balance has been credited with an amount of %.2f₸ by administrator %s.

• New credited amount: %.2f₸
• Credited by: %s 

If you believe this action was made in error or have any concerns, please contact support immediately.

— eReserve team`,
		user.Login,
		amount,
		requesterUser.Login,
		amount,
		requesterUser.Login,
	)

	if err := s.emailSender.SendEmail(
		user.Email,
		"Admin credit",
		message,
	); err != nil {
		slog.Error(
			"Error while sending email notification about  User balance credit",
			slog.Any("error", err), slog.Any("user", user),
			slog.Any("requester", requesterUser),
			slog.Float64("amount", amount),
		)
	}

	return s.repo.UpdateBalance(userID, amount)
}

func (s *UserService) Grant(ctx context.Context, userID int64, grantRole string) (int64, error) {
	requesterRole, roleExists := auth.GetRoleFromContext(ctx)
	if !roleExists {
		slog.Error("fetching role from context")
		return -1, entities.ErrUnhandledError
	}

	if grantRole == "" {
		return -1, entities.ErrGrantEmptyRole
	}

	// Possbile caution: if there are more roles who can grants, they can grant lower priviliges to people with higher privileges
	// for example manager can grant to owner the client role, now in this function it is prohibited, but there is no check that second grant is lower than requesterRole
	if !utils.In(grantRole, entities.AllRoles) {
		return -1, entities.ErrIncorrectRole
	} else if grantRole == entities.OwnerRole {
		return -1, entities.ErrGrantOwner
	} else if grantRole == requesterRole {
		return -1, entities.ErrGrantSameRole
	} else if err := entities.ValidateID(userID); err != nil {
		return -1, err
	}

	user, err := s.GetUser(userID)
	if err != nil {
		return -1, err
	}

	if !entities.RoleHasSufficientRightsToGrant(requesterRole, user.Role) {
		return -1, entities.ErrGrantInsufficientPriviliges
	}

	user.Role = grantRole

	userDTO := dto.User{
		Email:    user.Email,
		Username: user.Login,
		Status:   user.Status,
		Balance:  user.Balance,
		Role:     user.Role,
	}

	id, err := s.repo.Update(&userDTO)
	return id, err
}
