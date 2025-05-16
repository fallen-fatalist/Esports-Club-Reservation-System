package auth

type JWTManager interface {
	CreateToken(userID, role string) (string, error)
	ValidateToken(tokenStr string) (*Claims, error)
}
