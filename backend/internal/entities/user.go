package entities

import "errors"

type User struct {
	ID        int64   `json:"id"`
	Login     string  `json:"login"`
	Email     string  `json:"email"`
	Status    string  `json:"status"`
	Role      string  `json:"role"`
	Balance   float64 `json:"balance"`
	CreatedAt string  `json:"created_at"`
}

type UserCredentials struct {
	ID             int
	Email          string
	HashedPassword string
	Status         string
	Role           string // если роль используется при авторизации
}

// Errors
var (
	ErrInvalidUserID      = errors.New("invalid user id")
	ErrUserNotFound       = errors.New("user not found")
	ErrFailedToGetUser    = errors.New("failed to get user")
	ErrFailedToInsertUser = errors.New("failed to insert user")
)
