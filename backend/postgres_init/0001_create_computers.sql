CREATE TYPE club_room AS ENUM ('Standard', 'VIP', 'Console');
CREATE TYPE computer_status AS ENUM ('busy', 'available', 'pending', 'not working', 'under repair');

CREATE TABLE computers (
    computer_id SERIAL PRIMARY KEY,
    status computer_status DEFAULT 'available',
    room club_room DEFAULT 'Standard',
    cpu TEXT DEFAULT '',
    gpu TEXT DEFAULT '',
    ram TEXT DEFAULT '',
    ssd TEXT DEFAULT '',
    hdd TEXT DEFAULT '',
    monitor TEXT DEFAULT '',
    keyboard TEXT DEFAULT '',
    headset TEXT DEFAULT '',
    mouse TEXT DEFAULT '',
    mousepad TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



