-- === USERS ===
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user
-- NOTE: replace 'adminpassword' with a hashed password in production
INSERT INTO users (username, password, role, name)
VALUES ('admin', 'adminpassword', 'admin', 'Administrator');

-- === MEMBERS ===
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    status TEXT DEFAULT 'active',
    joined_date DATE DEFAULT NOW(),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- === EVENTS & CALENDAR ===
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location TEXT,
    type TEXT NOT NULL,
    organizer_id INTEGER
);

-- === SERVICES ===
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    attendance_count INTEGER DEFAULT 0,
    offering_amount INTEGER DEFAULT 0,
    notes TEXT
);

-- === DONATIONS ===
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    donor_name TEXT,
    amount INTEGER NOT NULL,
    date DATE DEFAULT NOW(),
    type TEXT NOT NULL,
    notes TEXT
);

-- === MINISTRIES ===
CREATE TABLE ministries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    leader_id INTEGER REFERENCES members(id)
);

CREATE TABLE ministry_members (
    id SERIAL PRIMARY KEY,
    ministry_id INTEGER NOT NULL REFERENCES ministries(id),
    member_id INTEGER NOT NULL REFERENCES members(id),
    role TEXT,
    joined_date DATE DEFAULT NOW()
);

-- === WELFARE ===
CREATE TABLE welfare_cases (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    beneficiary_name TEXT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount_requested INTEGER,
    amount_approved INTEGER,
    status TEXT DEFAULT 'pending',
    date DATE DEFAULT NOW(),
    notes TEXT
);

-- === EVANGELISM ===
CREATE TABLE evangelism_records (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'new',
    contact_date DATE DEFAULT NOW(),
    assigned_member_id INTEGER REFERENCES members(id),
    notes TEXT
);

-- === SESSION ===
CREATE TABLE session (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);
