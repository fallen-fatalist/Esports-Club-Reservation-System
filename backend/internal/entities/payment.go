package entities

import "errors"

var (
	ErrInsufficientBalance  = errors.New("insufficient balance")
	ErrBookingNotFound      = errors.New("booking not found")
	ErrPaymentFailed        = errors.New("payment failed")
	ErrPaymentTimeout       = errors.New("payment timeout")
	ErrPaymentCanceled      = errors.New("payment canceled")
	ErrUnknownPaymentStatus = errors.New("unknown payment status")
	ErrNegativeOrZeroAmount = errors.New("amount must be positive and non zero")
	ErrMaximumAmount        = errors.New("maximum amount exceeded")
)

const (
	EPS        = 0.0000001
	MAX_AMOUNT = 10000
)
