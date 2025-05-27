package implementation

import (
	"errors"
	"fmt"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"time"

	"esports_club_booking/internal/auth"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/service"
	"esports_club_booking/internal/transport/dto"
)

var _ service.UserService = (*UserService)(nil)

const (
	VerificationEmail    = "verification"
	ResetPasswordRequest = "reset_password"
)

func (s *UserService) Register(userDTO dto.RegisterUser) (int64, error) {
	// check if user already exists
	const op = "service.RegisterUser"

	if err := validateEmail(userDTO.Email); err != nil {
		return -1, err
	}

	if err := validateUsername(userDTO.Login); err != nil {
		return -1, err
	}

	if err := validatePassword(userDTO.Password); err != nil {
		return -1, err
	}

	_, err := s.repo.GetByEmail(userDTO.Email)
	if err == nil {
		return -1, service.ErrUserAlreadyExists
	} else if !errors.Is(err, entities.ErrUserNotFound) {
		return -1, fmt.Errorf("%s: failed to check existing user: %w", op, err)
	}
	_, err = s.repo.GetByLogin(userDTO.Login)
	if err == nil {
		return -1, service.ErrUserAlreadyExists
	} else if !errors.Is(err, entities.ErrUserNotFound) {
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
		Status: "unverified",
		Role:   entities.ClientRole,
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

	// Check that user is blocked
	if user.Status == entities.BlockedStatus {
		return "", entities.ErrUserBlocked
	}

	if err != nil {
		if errors.Is(err, entities.ErrUserNotFound) {
			return "", service.ErrInvalidCredentials
		}
		return "", fmt.Errorf("%s: failed to fetch user: %w", op, err)
	}

	// compare passwords from request and database
	if !auth.VerifyPassword(user.HashedPassword, userDTO.Password) {
		return "", service.ErrInvalidCredentials
	}
	if user.Status == entities.BlockedStatus ||
		user.Status == entities.UnverifiedStatus {
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
		if errors.Is(err, entities.ErrUserNotFound) {
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
	body := fmt.Sprintf("Don't share this code with anyone!\nYour verification code:"+
		" %s\n is valid until: %s", code, expiresAt.Format(time.RFC1123))
	subject := "Verification code"
	if err := s.emailSender.SendEmail(req.Email, subject, body); err != nil {
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
		return entities.ErrUserNotFound
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
		if errors.Is(err, entities.ErrUserNotFound) {
			return entities.ErrUserNotFound
		}
		return fmt.Errorf("%s: %w", op, err)
	}
	if user.Status != "active" {
		return fmt.Errorf("%s: user status is '%s', expected 'active'", op, user.Status)
	}
	now := time.Now()
	if user.PasswordUpdatedAt != nil &&
		((now.Sub(*user.PasswordUpdatedAt) < 24*time.Hour) && (now.Sub(*user.PasswordUpdatedAt) >= 10*time.Minute)) {
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
		"DON'T SHARE THIS CODE ANYONE!\nYour password reset code is: %s\n\nThis code will expire at %s.\nIf you did not request a password reset, please ignore this email.",
		code,
		expiresAt.Format(time.RFC1123),
	)

	subject := "Password Reset Code"

	if err := s.emailSender.SendEmail(email, subject, body); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *UserService) ConfirmPasswordReset(req dto.ResetPasswordConfirm) error {
	const op = "service.ResetPassword"

	if err := validatePassword(req.NewPassword); err != nil {
		return err
	}

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
	// check password update cooldown (24h) or later than 10 minutes (case when incorrect password changed)
	if userCr.PasswordUpdatedAt != nil && ((now.Sub(*userCr.PasswordUpdatedAt) < 24*time.Hour) && (now.Sub(*userCr.PasswordUpdatedAt) > 10*time.Minute)) {
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

var (
	// Username errors
	ErrUsernameEmpty               = errors.New("username cannot be empty")
	ErrUsernameLength              = errors.New("username must be between 3 and 20 characters")
	ErrUsernameWhitespace          = errors.New("username cannot contain any spaces or tabs")
	ErrUsernameStartLetter         = errors.New("username must start with a letter")
	ErrUsernameInvalidCharacters   = errors.New("username can only contain letters, numbers, underscores, and dots")
	ErrUsernameConsecutiveSpecials = errors.New("username cannot contain consecutive dots or underscores")
	ErrUsernameEndsWithSpecial     = errors.New("username cannot end with a dot or underscore")

	// Email errors
	ErrEmailEmpty         = errors.New("email cannot be empty")
	ErrEmailWhitespace    = errors.New("email cannot contain spaces or whitespace characters")
	ErrEmailInvalidFormat = errors.New("invalid email format")

	// Password errors
	ErrPasswordEmpty            = errors.New("password cannot be empty")
	ErrPasswordTooShort         = errors.New("password must be at least 8 characters long")
	ErrPasswordWhitespace       = errors.New("password cannot contain whitespace")
	ErrPasswordMissingLowercase = errors.New("password must contain at least one lowercase letter")
	ErrPasswordMissingUppercase = errors.New("password must contain at least one uppercase letter")
	ErrPasswordMissingDigit     = errors.New("password must contain at least one digit")
	ErrPasswordMissingSpecial   = errors.New("password must contain at least one special character")
)

// TODO: attach validations to UserDTO struct
func validateUsername(username string) error {
	if username == "" {
		return ErrUsernameEmpty
	}
	if len(username) < 3 || len(username) > 20 {
		return ErrUsernameLength
	}
	if strings.ContainsAny(username, " \t\n\r") {
		return ErrUsernameWhitespace
	}
	if !regexp.MustCompile(`^[a-zA-Z]`).MatchString(username) {
		return ErrUsernameStartLetter
	}
	if !regexp.MustCompile(`^[a-zA-Z0-9._]+$`).MatchString(username) {
		return ErrUsernameInvalidCharacters
	}
	if regexp.MustCompile(`[._]{2,}`).MatchString(username) {
		return ErrUsernameConsecutiveSpecials
	}
	if strings.HasSuffix(username, ".") || strings.HasSuffix(username, "_") {
		return ErrUsernameEndsWithSpecial
	}
	return nil
}

func validateEmail(email string) error {
	if email == "" {
		return ErrEmailEmpty
	}
	if strings.ContainsAny(email, " \t\n\r") {
		return ErrEmailWhitespace
	}
	emailRegex := `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`
	if !regexp.MustCompile(emailRegex).MatchString(email) {
		return ErrEmailInvalidFormat
	}
	return nil
}

func validatePassword(password string) error {
	if password == "" {
		return ErrPasswordEmpty
	}
	if len(password) < 8 {
		return ErrPasswordTooShort
	}
	if strings.ContainsAny(password, " \t\n\r") {
		return ErrPasswordWhitespace
	}
	if !regexp.MustCompile(`[a-z]`).MatchString(password) {
		return ErrPasswordMissingLowercase
	}
	if !regexp.MustCompile(`[A-Z]`).MatchString(password) {
		return ErrPasswordMissingUppercase
	}
	if !regexp.MustCompile(`[0-9]`).MatchString(password) {
		return ErrPasswordMissingDigit
	}
	if !regexp.MustCompile(`[!@#$%^&*()_\-+=\[\]{}|\\;:'",.<>/?]`).MatchString(password) {
		return ErrPasswordMissingSpecial
	}
	return nil
}
