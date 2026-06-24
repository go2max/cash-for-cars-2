-- server/db_init.sql
-- Run this if you want to initialize the DB manually (SQLite).
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  paperwork TEXT,
  keys TEXT,
  zipcode TEXT,
  vehicle_type TEXT,
  notes TEXT,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

