CREATE TABLE IF NOT EXISTS jobs (
id TEXT PRIMARY KEY,
command TEXT NOT NULL,
state TEXT NOT NULL DEFAULT 'pending',
attempts INTEGER NOT NULL DEFAULT 0,
max_retries INTEGER NOT NULL DEFAULT 3,
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL,
run_after TEXT NOT NULL,
last_error TEXT,
worker_id TEXT,
stdout TEXT,
stderr TEXT
);


-- config table
CREATE TABLE IF NOT EXISTS config (
key TEXT PRIMARY KEY,
value TEXT NOT NULL
);

-- simple metadata table (optional)
CREATE TABLE IF NOT EXISTS meta (
key TEXT PRIMARY KEY,
value TEXT NOT NULL
);