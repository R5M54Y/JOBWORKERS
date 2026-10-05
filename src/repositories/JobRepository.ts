// JOBWORKERS Job Repository
// Database abstraction for job operations

import { Pool } from '@neondatabase/serverless';
import { Job, CreateJobInput, UpdateJobInput, ListJobsFilters } from '../types/job';

export class JobRepository {
  constructor(private pool: Pool) {}

  async createJob(input: CreateJobInput): Promise<Job> {
    const result = await this.pool.query<Job>(
      `INSERT INTO jobs (
        source, source_job_id, title, company, location, description, url,
        category, employment_type, salary_min, salary_max, status, posted_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        input.source,
        input.source_job_id,
        input.title,
        input.company,
        input.location || 'Remote',
        input.description || '',
        input.url,
        input.category || 'other',
        input.employment_type || 'full-time',
        input.salary_min,
        input.salary_max,
        input.status || 'active',
        input.posted_at || new Date(),
        input.expires_at,
      ]
    );
    return result.rows[0];
  }

  async getJobById(id: number): Promise<Job | null> {
    const result = await this.pool.query<Job>(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async listJobs(filters: ListJobsFilters = {}): Promise<Job[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.source) {
      conditions.push(`source = $${paramIndex++}`);
      params.push(filters.source);
    }

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters.employment_type) {
      conditions.push(`employment_type = $${paramIndex++}`);
      params.push(filters.employment_type);
    }

    if (filters.location) {
      conditions.push(`location ILIKE $${paramIndex++}`);
      params.push(`%${filters.location}%`);
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const result = await this.pool.query<Job>(
      `SELECT * FROM jobs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return result.rows;
  }

  async updateJob(id: number, input: UpdateJobInput): Promise<Job | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      params.push(input.title);
    }

    if (input.company !== undefined) {
      fields.push(`company = $${paramIndex++}`);
      params.push(input.company);
    }

    if (input.location !== undefined) {
      fields.push(`location = $${paramIndex++}`);
      params.push(input.location);
    }

    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      params.push(input.description);
    }

    if (input.url !== undefined) {
      fields.push(`url = $${paramIndex++}`);
      params.push(input.url);
    }

    if (input.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      params.push(input.category);
    }

    if (input.employment_type !== undefined) {
      fields.push(`employment_type = $${paramIndex++}`);
      params.push(input.employment_type);
    }

    if (input.salary_min !== undefined) {
      fields.push(`salary_min = $${paramIndex++}`);
      params.push(input.salary_min);
    }

    if (input.salary_max !== undefined) {
      fields.push(`salary_max = $${paramIndex++}`);
      params.push(input.salary_max);
    }

    if (input.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      params.push(input.status);
    }

    if (input.expires_at !== undefined) {
      fields.push(`expires_at = $${paramIndex++}`);
      params.push(input.expires_at);
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      // Only updated_at changed, just fetch current
      return this.getJobById(id);
    }

    params.push(id);

    const result = await this.pool.query<Job>(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM jobs WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async upsertJob(input: CreateJobInput): Promise<Job> {
    const result = await this.pool.query<Job>(
      `INSERT INTO jobs (
        source, source_job_id, title, company, location, description, url,
        category, employment_type, salary_min, salary_max, status, posted_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (source, source_job_id) DO UPDATE SET
        title = EXCLUDED.title,
        company = EXCLUDED.company,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        category = EXCLUDED.category,
        employment_type = EXCLUDED.employment_type,
        salary_min = EXCLUDED.salary_min,
        salary_max = EXCLUDED.salary_max,
        status = EXCLUDED.status,
        posted_at = EXCLUDED.posted_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
      RETURNING *`,
      [
        input.source,
        input.source_job_id,
        input.title,
        input.company,
        input.location || 'Remote',
        input.description || '',
        input.url,
        input.category || 'other',
        input.employment_type || 'full-time',
        input.salary_min,
        input.salary_max,
        input.status || 'active',
        input.posted_at || new Date(),
        input.expires_at,
      ]
    );
    return result.rows[0];
  }
}
