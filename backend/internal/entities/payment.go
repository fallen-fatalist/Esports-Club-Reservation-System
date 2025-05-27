package entities

import "errors"

const EPS = 0.0000001
const MAX_AMOUNT = 10000

var (
	ErrNegativeOrZeroAmount = errors.New("amount must be positive and non zero")
	ErrMaximumAmount        = errors.New("maximum amount exceeded")
)
