CREATE TABLE packages (
    package_id SERIAL PRIMARY KEY,
    package_name TEXT,
    room club_room DEFAULT 'Standard',
    price INT NOT NULL,
    duration INT,
    startTime TIME,
    endTime TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);