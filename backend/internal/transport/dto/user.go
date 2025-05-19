package dto

// RegisterUser represents user registration data
// swagger:model RegisterUser
type RegisterUser struct {
	// required: true
	// example: user@example.com
	Email string `json:"email"`

	// required: true
	// example: username123
	Login string `json:"login"`

	// required: true
	// example: securePassword123
	Password string `json:"password"`
}

// LoginUser represents user login credentials
// swagger:model LoginUser
type LoginUser struct {
	// required: true
	// example: user@example.com
	Email string `json:"email"`

	// required: true
	// example: username123
	Login string `json:"login"`

	// required: true
	// example: securePassword123
	Password string `json:"password"`
}

// VerificationRequest represents verification code request
// swagger:model VerificationRequest
type VerificationRequest struct {
	// required: true
	// example: user@example.com
	Email string `json:"email"`
}

// VerifyEmailRequest represents email verification request
// swagger:model VerifyEmailRequest
type VerifyEmailRequest struct {
	// required: true
	// example: user@example.com
	Email string `json:"email"`

	// required: true
	// example: 123456
	Code string `json:"code"`
}

// JSONAnswer represents a generic JSON response
// swagger:model JSONAnswer
type JSONAnswer struct {
	// example: success message
	Message string `json:"message"`
}

type TokenResponse struct {
	Token string `json:"token"`
}
