package postgres

import (
	"database/sql"
	"fmt"
	"time"

	"esports_club_booking/internal/service"
)

func (r *UserRepository) SaveEmailVerification(email, code string, expiresAt time.Time) error {
	const op = "postgres.UserRepository.SaveEmailVerification"

	_, err := r.db.Exec(`
        INSERT INTO email_verifications(email, code, expires_at, created_at, attempts)
        VALUES ($1, $2, $3, NOW(), 0)
        ON CONFLICT (email) DO UPDATE
          SET code          = EXCLUDED.code,
              expires_at    = EXCLUDED.expires_at,
              attempts      = 0,
              last_attempt  = NULL,
              blocked_until = NULL
    `, email, code, expiresAt)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (r *UserRepository) GetVerificationByEmail(email string) (EmailVerification, error) {
	const op = "postgres.UserRepository.GetVerificationByEmail"

	row := r.db.QueryRow(`
        SELECT email, code, attempts, last_attempt, blocked_until, created_at, expires_at
        FROM email_verifications
        WHERE email = $1
    `, email)

	var v EmailVerification
	if err := row.Scan(&v.Email, &v.Code, &v.Attempts, &v.LastAttempt, &v.BlockedUntil, &v.CreatedAt, &v.ExpiresAt); err != nil {
		if err == sql.ErrNoRows {
			return v, service.ErrNoNeedVerification
		}
		return v, fmt.Errorf("%s: %w", op, err)
	}
	return v, nil
}

func (r *UserRepository) DeleteVerification(email string) error {
	const op = "postgres.UserRepository.DeleteVerification"

	_, err := r.db.Exec(`DELETE FROM email_verifications WHERE email = $1`, email)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (r *UserRepository) MarkEmailVerified(userID int64) error {
	const op = "postgres.UserRepository.MarkEmailVerified"

	_, err := r.db.Exec(`
        UPDATE users
        SET status = 'active'
        WHERE user_id = $1
    `, userID)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (r *UserRepository) IncrementAttempt(email string) error {
	const op = "postgres.UserRepository.IncrementAttempt"

	_, err := r.db.Exec(`
		UPDATE email_verifications
		SET attempts = attempts + 1,
		    last_attempt = NOW()
		WHERE email = $1
	`, email)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (r *UserRepository) BlockEmail(email string, duration time.Duration) error {
	const op = "postgres.UserRepository.BlockEmail"

	_, err := r.db.Exec(`
		UPDATE email_verifications
		SET blocked_until = $1
		WHERE email = $2
	`, time.Now().Add(duration), email)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (r *UserRepository) DeleteUnverifiedUsers(olderThan time.Time) error {
	const op = "postgres.UserRepository.DeleteUnverifiedUsers"

	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM email_verifications WHERE expires_at <= $1", olderThan)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	_, err = tx.Exec(`
		DELETE FROM users u
		WHERE u.status = 'unverified'
		AND NOT EXISTS (
			SELECT 1 FROM email_verifications ev
			WHERE ev.email = u.email
		)
	`)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}
