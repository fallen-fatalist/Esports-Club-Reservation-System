package dto

type DepositRequest struct {
	UserID int64   `json:"user_id"`
	Amount float64 `json:"amount"`
}

type BookingPaymentRequest struct {
	BookingID int64 `json:"booking_id"`
}
