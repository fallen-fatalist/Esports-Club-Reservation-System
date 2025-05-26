package entities

import (
	"errors"
	"time"
)

type User struct {
	ID                int64  `json:"id"`
	Login             string `json:"login"`
	Email             string `json:"email"`
	Status            string `json:"status"`
	PasswordUpdatedAt *time.Time
	Role              string `json:"role"`
	Balance           int    `json:"balance"`
	CreatedAt         string `json:"created_at"`
}

type UserCredentials struct {
	ID                int64
	Email             string
	HashedPassword    string
	PasswordUpdatedAt *time.Time
	Status            string
	Role              string // если роль используется при авторизации
}

// Errors
var (
	ErrInvalidUserID      = errors.New("invalid user id")
	ErrUserNotFound       = errors.New("user not found")
	ErrFailedToGetUser    = errors.New("failed to get user")
	ErrFailedToInsertUser = errors.New("failed to insert user")
)

// Roles
var (
	OwnerRole   = "owner"
	ManagerRole = "manager"
	AdminRole   = "admin"
	AnalystRole = "analyst"
	ClientRole  = "user"
)

// Statuses
var (
	ActiveStatus     = "active"
	BlockedStatus    = "blocked"
	UnverifiedStatus = "unverified"
)
