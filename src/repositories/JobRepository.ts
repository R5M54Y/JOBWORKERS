// JOBWORKERS Job Repository
// Database abstraction for job operations (D1/SQLite)

import { Job, CreateJobInput, UpdateJobInput, ListJobsFilters } from '../types/job';

export class JobRepository {
  constructor(private db: D1Database) {}

  async createJob(input: CreateJobInput): Promise<Job> {
    const stmt = this.db.prepare(
      `INSERT INTO jobs (
        source, source_job_id, title, company, location, description, url,
        category, employment_type, salary_min, salary_max, status, posted_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    ).bind(
      input.source,
      input.source_job_id,
      input.title,
      input.company,
      input.location || 'Remote',
      input.description || '',
      input.url,
      input.category || 'other',
      input.employment_type || 'full-time',
      input.salary_min || null,
      input.salary_max || null,
      input.status || 'active',
      input.posted_at ? input.posted_at.toISOString() : null,
      input.expires_at ? input.expires_at.toISOString() : null
    );

    const result = await stmt.first<Job>();
    if (!result) throw new Error('Failed to create job');
    return result;
  }

  async getJobById(id: number): Promise<Job | null> {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE id = ?').bind(id);
    return await stmt.first<Job>();
  }

  async listJobs(filters: ListJobsFilters = {}): Promise<Job[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }

    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (filters.employment_type) {
      conditions.push('employment_type = ?');
      params.push(filters.employment_type);
    }

    if (filters.location) {
      conditions.push('location LIKE ?');
      params.push(`%${filters.location}%`);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    params.push(limit, offset);

    const stmt = this.db.prepare(
      `SELECT * FROM jobs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params);

    const result = await stmt.all<Job>();
    return result.results || [];
  }

  async updateJob(id: number, input: UpdateJobInput): Promise<Job | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (input.title !== undefined) {
      fields.push('title = ?');
      params.push(input.title);
    }

    if (input.company !== undefined) {
      fields.push('company = ?');
      params.push(input.company);
    }

    if (input.location !== undefined) {
      fields.push('location = ?');
      params.push(input.location);
    }

    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description);
    }

    if (input.url !== undefined) {
      fields.push('url = ?');
      params.push(input.url);
    }

    if (input.category !== undefined) {
      fields.push('category = ?');
      params.push(input.category);
    }

    if (input.employment_type !== undefined) {
      fields.push('employment_type = ?');
      params.push(input.employment_type);
    }

    if (input.salary_min !== undefined) {
      fields.push('salary_min = ?');
      params.push(input.salary_min);
    }

    if (input.salary_max !== undefined) {
      fields.push('salary_max = ?');
      params.push(input.salary_max);
    }

    if (input.status !== undefined) {
      fields.push('status = ?');
      params.push(input.status);
    }

    if (input.expires_at !== undefined) {
      fields.push('expires_at = ?');
      params.push(input.expires_at ? input.expires_at.toISOString() : null);
    }

    fields.push("updated_at = datetime('now')");

    if (fields.length === 1) {
      // Only updated_at changed
      return this.getJobById(id);
    }

    params.push(id);

    const stmt = this.db.prepare(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = ? RETURNING *`
    ).bind(...params);

    return await stmt.first<Job>();
  }

  async deleteJob(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM jobs WHERE id = ?').bind(id);
    const result = await stmt.run();
    return result.success && (result.meta.changes || 0) > 0;
  }

  async upsertJob(input: CreateJobInput): Promise<Job> {
    const stmt = this.db.prepare(
      `INSERT INTO jobs (
        source, source_job_id, title, company, location, description, url,
        category, employment_type, salary_min, salary_max, status, posted_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source, source_job_id) DO UPDATE SET
        title = excluded.title,
        company = excluded.company,
        location = excluded.location,
        description = excluded.description,
        url = excluded.url,
        category = excluded.category,
        employment_type = excluded.employment_type,
        salary_min = excluded.salary_min,
        salary_max = excluded.salary_max,
        status = excluded.status,
        posted_at = excluded.posted_at,
        expires_at = excluded.expires_at,
        updated_at = datetime('now')
      RETURNING *`
    ).bind(
      input.source,
      input.source_job_id,
      input.title,
      input.company,
      input.location || 'Remote',
      input.description || '',
      input.url,
      input.category || 'other',
      input.employment_type || 'full-time',
      input.salary_min || null,
      input.salary_max || null,
      input.status || 'active',
      input.posted_at ? input.posted_at.toISOString() : null,
      input.expires_at ? input.expires_at.toISOString() : null
    );

    const result = await stmt.first<Job>();
    if (!result) throw new Error('Failed to upsert job');
    return result;
  }
}
