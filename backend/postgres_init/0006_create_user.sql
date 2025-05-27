CREATE TYPE user_role AS ENUM ('owner', 'manager', 'admin', 'analyst' , 'client');
CREATE TYPE user_status AS ENUM ('active', 'blocked','unverified');
CREATE TYPE user_promotion AS ENUM ('flyer', 'birthday', 'no');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    login TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    status user_status DEFAULT 'active',
    role user_role DEFAULT 'client',
    balance REAL DEFAULT 0 CHECK (balance >= 0),
    promotion user_promotion DEFAULT 'no',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    password_updated_at TIMESTAMPTZ DEFAULT NOW() - INTERVAL '2 days'
    CONSTRAINT email_format_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

