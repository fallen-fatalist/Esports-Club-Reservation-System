package dto

type DepositRequest struct {
	Amount float64 `json:"amount"`
}

type BookingPaymentRequest struct {
	BookingID int64 `json:"booking_id"`
}
