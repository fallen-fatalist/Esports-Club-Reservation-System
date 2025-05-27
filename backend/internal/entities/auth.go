package entities

import "errors"

var (
	ErrUnauthorized         = errors.New("not authorized")
	ErrNonOwnBookingCancel  = errors.New("can't cancel non own booking")
	ErrUserBlocked          = errors.New("user is blocked")
	ErrAlreadyAuthenticated = errors.New("already authenticated")
	ErrInvalidToken         = errors.New("invalid token")
)

var AllRoles []string = []string{
	OwnerRole,
	ManagerRole,
	AdminRole,
	AnalystRole,
	ClientRole,
}

var PrivellegedRoles []string = []string{
	OwnerRole,
	ManagerRole,
	AdminRole,
}

var NonPrivellegedRoles []string = []string{
	AnalystRole,
	ClientRole,
}
