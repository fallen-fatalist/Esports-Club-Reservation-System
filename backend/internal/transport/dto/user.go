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
	Identifier string `json:"identifier"`

	// required: true
	// example: securePassword123
	Password string `json:"password"`
}

// EmailVerificationRequest represents verification code request
// swagger:model EmailVerificationRequest
type EmailVerificationRequest struct {
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

// First user presses Forget Password button and sends his email, then we send a code and user is redirected to
type ResetPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordConfirm struct {
	Email       string `json:"email"`
	Code        string `json:"code"`
	NewPassword string `json:"new_password"`
}

// JSONAnswer represents a generic JSON response
// swagger:model JSONAnswer
type JSONAnswer struct {
	// example: success message
	Message string `json:"message"`
}

// Rasul do comment here please
type TokenResponse struct {
	Token string `json:"token"`
}

type User struct {
	Username string  `json:"username"`
	Email    string  `json:"email"`
	Status   string  `json:"status"`
	Role     string  `json:"role"`
	Balance  float64 `json:"balance"`
}
