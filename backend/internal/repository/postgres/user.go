package postgres

import (
	"database/sql"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/service"
	"fmt"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) (*UserRepository, error) {
	if db != nil {
		return &UserRepository{db}, nil
	}

	panic("Empty database provided to User repository constructor")
}
func (r *UserRepository) GetAll() ([]*entities.User, error) {
	query := `
		SELECT user_id, login, email, status, role, balance, created_at 
		FROM users 
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*entities.User

	for rows.Next() {
		user := &entities.User{}

		err = rows.Scan(
			&user.ID,
			&user.Login,
			&user.Email,
			&user.Status,
			&user.Role,
			&user.Balance,
			&user.CreatedAt,
		)

		if err != nil {
			return nil, err
		}

		users = append(users, user)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *UserRepository) GetByID(id int64) (*entities.User, error) {
	return nil, nil
}

func (r *UserRepository) GetCredentialsByEmail(email string) (entities.UserCredentials, error) {
	query := `SELECT user_id, hashed_password, role, status FROM users WHERE email = $1`

	var uc entities.UserCredentials
	err := r.db.QueryRow(query, email).Scan(
		&uc.ID,
		&uc.HashedPassword,
		&uc.Role,
		&uc.Status,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return uc, service.ErrUserNotFound
		}
		return uc, fmt.Errorf("repository.GetCredentialsByEmail: failed to get user: %w", err)
	}
	return uc, nil
}

func (r *UserRepository) GetByEmail(email string) (entities.User, error) {
	query := `
        SELECT user_id, login, email, status, role, balance, created_at
        FROM users 
        WHERE email = $1
    `
	var user entities.User
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Login,
		&user.Email,
		&user.Status,
		&user.Role,
		&user.Balance,
		&user.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return user, service.ErrUserNotFound
		}
		return user, fmt.Errorf("repository.GetByEmail: failed to get user: %w", err)
	}
	return user, nil
}

func (r *UserRepository) Create(user *entities.User, hashedPassword string) (int64, error) {
	query := `
		INSERT INTO users (login, email, hashed_password, status, role, balance, promotion)
		VALUES ($1, $2, $3, $4, $5, $6, '')
		RETURNING user_id
	`
	err := r.db.QueryRow(query,
		user.Login,
		user.Email,
		hashedPassword,
		user.Status,
		user.Role,
		user.Balance,
	).Scan(&user.ID)

	if err != nil {
		return -1, fmt.Errorf("repository.Create: failed to insert user: %w", err)
	}

	return user.ID, nil
}

func (r *UserRepository) Update(booking *entities.Booking) (int64, error) {
	return 0, nil
}

func (r *UserRepository) Delete(id int64) error {
	return nil
}
