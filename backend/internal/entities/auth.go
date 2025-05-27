package entities

import "errors"

var (
	ErrUnauthorized         = errors.New("not authorized")
	ErrNonOwnBookingCancel  = errors.New("can't cancel non own booking")
	ErrUserBlocked          = errors.New("user is blocked")
	ErrAlreadyAuthenticated = errors.New("already authenticated")
	ErrInvalidToken         = errors.New("invalid token")
	ErrInsufficientPriv     = errors.New("insufficient privileges")
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

// Roles
var (
	OwnerRole   = "owner"
	ManagerRole = "manager"
	AdminRole   = "admin"
	AnalystRole = "analyst"
	ClientRole  = "client"
)

// RoleHasSufficientRights returns true if the first role is more privileged than the second.
// Order of privilege:
// 1. Owner
// 2. Manager
// 3. Admin
// 4. Analyst
// 5. Client
func RoleHasSufficientRights(ownrole string, otherrole string) bool {
	if otherrole == OwnerRole {
		return false
	} else if ownrole == OwnerRole {
		return true
	} else if ownrole == ManagerRole && (otherrole == AdminRole || otherrole == AnalystRole || otherrole == ClientRole) {
		return true
	} else if ownrole == AdminRole && (otherrole == AnalystRole || otherrole == ClientRole) {
		return true
	}
	return false
}
