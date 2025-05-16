package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string
	Role   string
}

type jwtManager struct {
	secret     string
	expiration time.Duration
}

func NewJWTManager(Secret string, Expiration time.Duration) JWTManager {
	return &jwtManager{
		secret:     Secret,
		expiration: Expiration,
	}
}

func (j *jwtManager) CreateToken(userID, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(j.expiration).Unix(),
	})

	return token.SignedString([]byte(j.secret))
}

func (j *jwtManager) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(j.secret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	claimsMap, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}

	userID, ok1 := claimsMap["sub"].(string)
	role, ok2 := claimsMap["role"].(string)

	if !ok1 || !ok2 {
		return nil, errors.New("missing claims data")
	}

	return &Claims{
		UserID: userID,
		Role:   role,
	}, nil
}
