package service

import "errors"

var (
	ErrUserAlreadyExists       = errors.New("user with this email already exists")
	ErrUserNotFound            = errors.New("user not found")
	ErrInvalidVerificationCode = errors.New("invalid or expired verification code ")
	ErrTooManyAttempts         = errors.New("too many attempts, try later")
	ErrNoVerification          = errors.New("user is not verificated")
	ErrUserBlockedOrUnverified = errors.New("user not verified or blocked")
	ErrNoNeedVerification      = errors.New("user didn't request code or doent't need verification ")
)
