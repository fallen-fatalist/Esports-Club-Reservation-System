package entities

import "errors"

var (
	ErrInsufficientBalance  = errors.New("insufficient balance")
	ErrBookingNotFound      = errors.New("booking not found")
	ErrPaymentFailed        = errors.New("payment failed")
	ErrPaymentTimeout       = errors.New("payment timeout")
	ErrPaymentCanceled      = errors.New("payment canceled")
	ErrUnknownPaymentStatus = errors.New("unknown payment status")
)
