CREATE TABLE email_verifications (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,                      -- 6-значный код
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP,
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP                     -- код истекает через 15 мин
);
