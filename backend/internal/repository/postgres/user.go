package postgres

import (
	"database/sql"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/transport/dto"
	"fmt"
	"log/slog"
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
	query := `
		SELECT user_id, login, email, status, role, balance, created_at
		FROM users
		WHERE user_id = $1
	`
	var user entities.User
	err := r.db.QueryRow(query, id).Scan(
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
			return nil, entities.ErrUserNotFound
		}
		return nil, fmt.Errorf("repository.GetByID: failed to get user: %w", err)
	}
	return &user, nil
}

func (r *UserRepository) GetCredentialsByEmail(email string) (entities.UserCredentials, error) {
	query := `SELECT user_id, hashed_password, role, status,password_updated_at FROM users WHERE email = $1`

	var uc entities.UserCredentials
	err := r.db.QueryRow(query, email).Scan(
		&uc.ID,
		&uc.HashedPassword,
		&uc.Role,
		&uc.Status,
		&uc.PasswordUpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return uc, entities.ErrUserNotFound
		}
		return uc, entities.ErrFailedToGetUser
	}
	return uc, nil
}

func (r *UserRepository) GetCredentialsByLogin(login string) (entities.UserCredentials, error) {
	query := `SELECT user_id, hashed_password, role, status FROM users WHERE login = $1`

	var uc entities.UserCredentials
	err := r.db.QueryRow(query, login).Scan(
		&uc.ID,
		&uc.HashedPassword,
		&uc.Role,
		&uc.Status,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return uc, entities.ErrUserNotFound
		}
		return uc, entities.ErrFailedToGetUser
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
			return user, entities.ErrUserNotFound
		}
		return user, entities.ErrFailedToGetUser
	}
	return user, nil
}

func (r *UserRepository) GetByLogin(login string) (entities.User, error) {
	query := `
        SELECT user_id, login, email, status, role, balance, created_at
        FROM users 
        WHERE login = $1
    `
	var user entities.User
	err := r.db.QueryRow(query, login).Scan(
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
			return user, entities.ErrUserNotFound
		}
		return user, entities.ErrFailedToGetUser
	}
	return user, nil
}

func (r *UserRepository) Create(user *entities.User, hashedPassword string) (int64, error) {
	query := `
		INSERT INTO users (login, email, hashed_password, status, role, balance)
		VALUES ($1, $2, $3, $4, $5, $6)
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
		slog.Error("Failed to insert user", slog.Any("error", err))
		return -1, entities.ErrFailedToInsertUser
	}

	return user.ID, nil
}

func (r *UserRepository) Update(user *dto.User) (int64, error) {
	query := `
		UPDATE users
		SET 
			login = $5,
			status = $2,
			role = $3,
			balance = $4
		WHERE email = $1
	`

	result, err := r.db.Exec(query, user.Email, user.Status, user.Role, user.Balance, user.Username)
	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, err
	} else if rowsAffected == 0 {
		return 0, entities.ErrUserNotFound
	}

	return rowsAffected, nil
}

func (r *UserRepository) Delete(userID int64) error {
	query := `DELETE FROM users WHERE user_id = $1`

	result, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return entities.ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) UpdatePassword(userID int64, hashedPassword string) error {
	const op = "repo.UpdatePassword"

	query := `
		UPDATE users
		SET hashed_password = $1,
		    password_updated_at = NOW()
		WHERE user_id = $2
	`

	res, err := r.db.Exec(query, hashedPassword, userID)
	if err != nil {
		return fmt.Errorf("%s: failed to update password: %w", op, err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s: failed to check rows affected: %w", op, err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%s: user not found", op)
	}

	return nil
}

func (r *UserRepository) Block(userID int64) error {
	const op = "postgres.UserRepository.Block"

	res, err := r.db.Exec(`
				UPDATE users
				SET status = $1
				WHERE user_id = $2
			`, entities.BlockedStatus, userID)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s: failed to check rows affected: %w", op, err)
	}
	if rowsAffected == 0 {
		return entities.ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) Unblock(userID int64) error {
	const op = "postgres.UserRepository.Unblock"

	res, err := r.db.Exec(`
				UPDATE users
				SET status = $1
				WHERE user_id = $2
			`, entities.ActiveStatus, userID)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s: failed to check rows affected: %w", op, err)
	}
	if rowsAffected == 0 {
		return entities.ErrUserNotFound
	}

	return nil
}

// UpdateBalance updates the balance of a user by the specified amount.
// It adds the amount to the existing balance.
func (r *UserRepository) UpdateBalance(userID int64, amount float64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Optionally you can lock the row for update to prevent race conditions
	var currentBalance float64
	err = tx.QueryRow(`SELECT balance FROM users WHERE user_id = $1 FOR UPDATE`, userID).Scan(&currentBalance)
	if err != nil {
		if err == sql.ErrNoRows {
			return entities.ErrUserNotFound
		}
		return fmt.Errorf("query current balance: %w", err)
	}

	newBalance := currentBalance + amount

	_, err = tx.Exec(`UPDATE users SET balance = $1 WHERE user_id = $2`, newBalance, userID)
	if err != nil {
		return fmt.Errorf("update balance: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}
