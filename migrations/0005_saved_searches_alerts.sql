-- JOBWORKERS Database Schema for D1 (SQLite)
-- Migration 0005: Saved searches and job alerts
-- Supports Phase 9 job discovery alerts

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search TEXT,
  source TEXT,
  location TEXT,
  employment_type TEXT,
  category TEXT,
  remote INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_is_active ON saved_searches(is_active);
CREATE INDEX IF NOT EXISTS idx_saved_searches_last_checked_at ON saved_searches(last_checked_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_searches_user_name ON saved_searches(user_id, name);

-- Job alerts table
CREATE TABLE IF NOT EXISTS job_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  saved_search_id INTEGER NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(saved_search_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_alerts_saved_search_id ON job_alerts(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_job_id ON job_alerts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at ON job_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_alerts_read_at ON job_alerts(read_at);
