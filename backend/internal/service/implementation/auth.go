package implementation

import (
	"errors"
	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/transport/dto"
	"fmt"
	"math/rand"
	"strconv"
	"strings"
	"time"
)

func (s *UserService) Register(userDTO dto.RegisterUser) (int64, error) {
	// check if user already exists
	const op = "service.RegisterUser"
	_, err := s.repo.GetByEmail(userDTO.Email)
	if err == nil {
		return -1, service.ErrUserAlreadyExists
	} else if !errors.Is(err, service.ErrUserNotFound) {
		return -1, fmt.Errorf("%s: failed to check existing user: %w", op, err)
	}
	_, err = s.repo.GetByLogin(userDTO.Login)
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
		Status: "unverified",
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
	var user entities.UserCredentials
	var err error

	if strings.Contains(userDTO.Identifier, "@") {
		user, err = s.repo.GetCredentialsByEmail(userDTO.Identifier)
	} else {
		user, err = s.repo.GetCredentialsByLogin(userDTO.Identifier)
	}

	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return "", service.ErrInvalidCredentials
		}
		return "", fmt.Errorf("%s: failed to fetch user: %w", op, err)
	}

	// compare passwords from request and database
	if !auth.VerifyPassword(user.HashedPassword, userDTO.Password) {
		return "", errors.New("invalid email or password")
	}
	if user.Status == "blocked" || user.Status == "unverified" {
		return "", service.ErrUserBlockedOrUnverified
	}
	//generate jwt token and sign it (auth.CreateJWT already signs it for you)
	userIDstr := strconv.Itoa(user.ID)
	tokenString, err := s.jwt.CreateToken(userIDstr, user.Role)
	if err != nil {
		return "", fmt.Errorf("%s: failed to generate JWT token: %w", op, err)
	}

	return tokenString, nil
}

func (s *UserService) SendVerificationCode(req dto.VerificationRequest) error {
	const op = "service.SendVerificationCode"

	user, err := s.repo.GetCredentialsByEmail(req.Email)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return errors.New("invalid email")
		}
		return fmt.Errorf("%s: failed to fetch user: %w", op, err)
	}

	if user.Status != "unverified" {
		return fmt.Errorf("user already verified")
	}
	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	expiresAt := time.Now().Add(15 * time.Minute)

	if _, err := s.repo.GetVerificationByEmail(req.Email); err == nil {
		return fmt.Errorf("%s: %w", op, service.ErrSentCodeAlready)
	}

	if err := s.repo.SaveEmailVerification(req.Email, code, expiresAt); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	body := fmt.Sprintf("Don't share this code with anyone!\nYour verification code: %s\n is valid until: %s", code, expiresAt.Format(time.RFC1123))
	subject := "Verification code"
	if err := s.emailSender.SendEmail(req.Email, subject, body); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *UserService) VerifyEmail(req dto.VerifyEmailRequest) error {
	const op = "service.VerifyEmail"

	v, err := s.repo.GetVerificationByEmail(req.Email)
	if errors.Is(err, service.ErrNoNeedVerification) {
		return service.ErrNoNeedVerification
	}
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	now := time.Now()
	if v.BlockedUntil.Valid && v.BlockedUntil.Time.After(now) {
		return service.ErrTooManyAttempts
	}
	if v.Attempts >= 5 {
		// блокируем на 15 минут
		if err := s.repo.BlockEmail(req.Email, 15*time.Minute); err != nil {
			return err
		}
		return service.ErrTooManyAttempts
	}

	// 2) Проверяем срок и код
	if now.After(v.ExpiresAt) || v.Code != req.Code {
		// инкремент попыток и обновляем last_attempt
		_ = s.repo.IncrementAttempt(req.Email)
		return service.ErrInvalidVerificationCode
	}

	// 3) Всё ок — создаём или активируем пользователя
	user, err := s.repo.GetByEmail(req.Email)
	if err != nil {
		return service.ErrUserNotFound
	}
	if err := s.repo.MarkEmailVerified(user.ID); err != nil {
		return err
	}

	// 4) Удаляем запись о верификации
	if err := s.repo.DeleteVerification(req.Email); err != nil {
		return err
	}
	return nil
}

func (s *UserService) DeleteUnverifiedUsers() error {
	return s.repo.DeleteUnverifiedUsers(time.Now())
}
