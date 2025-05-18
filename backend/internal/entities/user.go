package entities

type User struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	Email     string `json:"email"`
	Status    string `json:"status"`
	Role      string `json:"role"`
	Balance   int    `json:"balance"`
	CreatedAt string `json:"created_at"`
}

type UserCredentials struct {
	ID             int
	Email          string
	HashedPassword string
	Status         string
	Role           string // если роль используется при авторизации
}
