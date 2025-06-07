package entities

import (
	"errors"
	"esports_club_booking/internal/utils"
)

var (
	ErrUnauthorized         = errors.New("not authorized")
	ErrNonOwnBookingCancel  = errors.New("can't cancel non own booking")
	ErrUserBlocked          = errors.New("user is blocked")
	ErrAlreadyAuthenticated = errors.New("already authenticated")
	ErrInvalidToken         = errors.New("invalid token")
	ErrInsufficientPriv     = errors.New("insufficient privileges")
	ErrMissingToken         = errors.New("missing token")
	// Only hierarchical grant, can grant only lower priviliges:
	// 1. Owner can grant to managers, administrators, analysts
	// 2. Managers can grant administrators, analysts
	// 3. Administrator nobody
	ErrGrantEmptyRole              = errors.New("empty role to grant provided")
	ErrGrantOwner                  = errors.New("can't grant owner role")
	ErrGrantSameRole               = errors.New("can't grant the same privileged role")
	ErrGrantInsufficientPriviliges = errors.New("insufficient priviliges to grant role")
)

// MUST BE: In descending priviliges order
// If it's not sorted the descending order, the privilged operations will be broken
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

var ManagementRoles []string = []string{
	OwnerRole,
	ManagerRole,
}

// Roles
var (
	OwnerRole   = "owner"
	ManagerRole = "manager"
	AdminRole   = "admin"
	AnalystRole = "analyst"
	ClientRole  = "client"
)

func RequesterMorePriviliged(requesterRole, subjectUserRole string) bool {
	if !utils.In(requesterRole, AllRoles) || !(utils.In(subjectUserRole, AllRoles)) {
		return false
	}

	var requesterID int = -1
	var subjectUserID int = -1
	for idx, role := range AllRoles {
		if role == requesterRole {
			requesterID = idx
		} else if role == subjectUserRole {
			subjectUserID = idx
		}
	}

	return requesterID < subjectUserID
}

// RoleHasSufficientRightsToDelete returns true if the client role has privilige to delete the another user.
// Order of privilege:
// 1. Owner
// 2. Manager
// 3. Admin
// 4. Analyst
// 5. Client
func RoleHasSufficientRightsToDelete(requesterRole string, subjectUserRole string) bool {
	if subjectUserRole == OwnerRole {
		return false
	} else if !RequesterMorePriviliged(requesterRole, subjectUserRole) {
		return false
	} else if requesterRole == OwnerRole {
		return true
	} else if requesterRole == ManagerRole && (subjectUserRole == AdminRole || subjectUserRole == AnalystRole || subjectUserRole == ClientRole) {
		return true
	}
	return false
}

func RoleHasSufficientRightsToBlock(requesterRole string, subjectUserRole string) bool {
	if subjectUserRole == OwnerRole {
		return false
	} else if !RequesterMorePriviliged(requesterRole, subjectUserRole) {
		return false
	} else if requesterRole == OwnerRole {
		return true
	} else if requesterRole == ManagerRole && (subjectUserRole == AdminRole || subjectUserRole == AnalystRole || subjectUserRole == ClientRole) {
		return true
	} else if requesterRole == AdminRole && (subjectUserRole == AnalystRole || subjectUserRole == ClientRole) {
		return true
	}
	return false
}

func RoleHasSufficientRightsToGrant(requesterRole string, subjectUserRole string) bool {
	if !IsCorrectRole(requesterRole) || !IsCorrectRole(subjectUserRole) {
		return false
	} else if !utils.In(requesterRole, ManagementRoles) {
		return false
	} else if RequesterMorePriviliged(requesterRole, subjectUserRole) {
		return true
	}
	return false
}

func IsCorrectRole(role string) bool {
	return utils.In(role, AllRoles)
}

// switch case 0_0
func CheckEnumUserRole(role string) bool {
	switch role {
	case OwnerRole, ManagerRole, AdminRole, AnalystRole, ClientRole:
		return true
	default:
		return false
	}
}
