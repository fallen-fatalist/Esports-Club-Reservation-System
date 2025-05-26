CREATE TYPE email_code_type AS ENUM (
  'verification',
  'reset_password',
  'email_change',
  'delete_account'
);

CREATE TABLE email_verifications (
    email TEXT NOT NULL,
    type email_code_type NOT NULL,
    code TEXT NOT NULL,
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP,
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP,
    PRIMARY KEY (email, type)
);
