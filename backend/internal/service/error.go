package service

import "errors"

var (
	ErrUserAlreadyExists       = errors.New("user with this email already exists")
	ErrInvalidCredentials      = errors.New("invalid credentials")
	ErrInvalidVerificationCode = errors.New("invalid or expired verification code ")
	ErrTooManyAttempts         = errors.New("too many attempts, try later")
	ErrNoVerification          = errors.New("user is not verificated")
	ErrUserBlockedOrUnverified = errors.New("user not verified or blocked")
	ErrNoNeedVerification      = errors.New("user didn't request code or doent't need verification ")
	ErrSentCodeAlready         = errors.New("code already sent")
	ErrPasswordRecentlyChanged = errors.New("password changed recently")
)
