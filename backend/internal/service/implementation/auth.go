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

const (
	VerificationEmail    = "verification"
	ResetPasswordRequest = "reset_password"
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
		return "", service.ErrInvalidCredentials
	}
	if user.Status == "blocked" || user.Status == "unverified" {
		return "", service.ErrUserBlockedOrUnverified
	}
	//generate jwt token and sign it (auth.CreateJWT already signs it for you)
	userIDstr := strconv.FormatInt(user.ID, 10)
	tokenString, err := s.jwt.CreateToken(userIDstr, user.Role)
	if err != nil {
		return "", fmt.Errorf("%s: failed to generate JWT token: %w", op, err)
	}

	return tokenString, nil
}

func (s *UserService) SendVerificationCode(req dto.EmailVerificationRequest) error {
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

	if _, err := s.repo.GetVerification(req.Email, VerificationEmail); err == nil {
		return fmt.Errorf("%s: %w", op, service.ErrSentCodeAlready)
	}

	if err := s.repo.SaveVerification(req.Email, code, VerificationEmail, expiresAt); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	body := fmt.Sprintf(
		"Your verification code is: %s\n\nThis code is valid until %s.",
		code,
		expiresAt.Format(time.RFC1123),
	)

	if err := s.emailSender.SendEmail(req.Email, "Email Verification Code", body); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *UserService) VerifyEmail(req dto.VerifyEmailRequest) error {
	const op = "service.VerifyEmail"

	v, err := s.repo.GetVerification(req.Email, VerificationEmail)
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
		if err := s.repo.BlockEmail(req.Email, VerificationEmail, 15*time.Minute); err != nil {
			return err
		}
		return service.ErrTooManyAttempts
	}

	// 2) Проверяем срок и код
	if now.After(v.ExpiresAt) || v.Code != req.Code {
		// инкремент попыток и обновляем last_attempt
		_ = s.repo.IncrementAttempt(req.Email, VerificationEmail)
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
	if err := s.repo.DeleteVerification(req.Email, VerificationEmail); err != nil {
		return err
	}
	return nil
}

func (s *UserService) DeleteUnverifiedUsers() error {
	return s.repo.DeleteUnverifiedUsers(time.Now())
}

// reset password logic

func (s *UserService) SendPasswordResetCode(email string) error {
	const op = "service.RequestPasswordReset"

	user, err := s.repo.GetCredentialsByEmail(email)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return service.ErrUserNotFound
		}
		return fmt.Errorf("%s: %w", op, err)
	}
	if user.Status != "active" {
		return fmt.Errorf("%s: user status is '%s', expected 'active'", op, user.Status)
	}
	now := time.Now()
	if user.PasswordUpdatedAt != nil && now.Sub(*user.PasswordUpdatedAt) < 24*time.Hour {
		return service.ErrPasswordRecentlyChanged
	}

	if _, err := s.repo.GetVerification(email, ResetPasswordRequest); err == nil {
		return fmt.Errorf("%s: %w", op, service.ErrSentCodeAlready)
	}

	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	expiresAt := time.Now().Add(15 * time.Minute)

	if err := s.repo.SaveVerification(email, code, ResetPasswordRequest, expiresAt); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	body := fmt.Sprintf(
		"Your password reset code is: %s\n\nThis code will expire at %s.\nIf you did not request a password reset, please ignore this email.",
		code,
		expiresAt.Format(time.RFC1123),
	)

	if err := s.emailSender.SendEmail(email, "Password Reset Request", body); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *UserService) ConfirmPasswordReset(req dto.ResetPasswordConfirm) error {
	const op = "service.ResetPassword"
	// 1. get info about verification

	v, err := s.repo.GetVerification(req.Email, ResetPasswordRequest)
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
		_ = s.repo.BlockEmail(req.Email, ResetPasswordRequest, 15*time.Minute)
		return service.ErrTooManyAttempts
	}

	// 3. get full user info
	userCr, err := s.repo.GetCredentialsByEmail(req.Email)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	if userCr.Status != "active" {
		return fmt.Errorf("%s: user status is '%s', expected 'active'", op, userCr.Status)
	}
	// check password update cooldown (24h)
	if userCr.PasswordUpdatedAt != nil && now.Sub(*userCr.PasswordUpdatedAt) < 24*time.Hour {
		return service.ErrPasswordRecentlyChanged
	}

	// 2. check of expiration and code
	if now.After(v.ExpiresAt) || v.Code != req.Code {
		_ = s.repo.IncrementAttempt(req.Email, ResetPasswordRequest)
		return service.ErrInvalidVerificationCode
	}

	// 4. hash and change password
	hashedPassword, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("%s: failed to hash password: %w", op, err)
	}
	if err := s.repo.UpdatePassword(userCr.ID, hashedPassword); err != nil {
		return fmt.Errorf("%s: failed to update password: %w", op, err)
	}

	// 5. and delete information about verification
	if err := s.repo.DeleteVerification(req.Email, ResetPasswordRequest); err != nil {
		return fmt.Errorf("%s: failed to delete verification: %w", op, err)
	}

	return nil
}
