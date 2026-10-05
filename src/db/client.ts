// JOBWORKERS Database Client
// Cloudflare D1 client for Workers

export async function initSchema(db: D1Database): Promise<void> {
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- Jobs table
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      source_job_id TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT 'Remote',
      description TEXT DEFAULT '',
      url TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      employment_type TEXT DEFAULT 'full-time',
      salary_min INTEGER,
      salary_max INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
      posted_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source, source_job_id)
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
    CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
    CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
    CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

    -- Job applications table
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
      cover_letter TEXT,
      resume_url TEXT,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(job_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
    CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at DESC);
  `;

  // Execute schema as batch (D1 supports multiple statements)
  await db.exec(schema);
}
