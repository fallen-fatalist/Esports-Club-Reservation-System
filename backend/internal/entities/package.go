package entities

type Package struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Price     int    `json:"price"`
	Room      string `json:"room"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	CreatedAt string `json:"created_at"`
}
