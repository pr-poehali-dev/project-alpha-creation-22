CREATE TABLE t_p6725301_project_alpha_creati.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    nickname VARCHAR(50) UNIQUE,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
