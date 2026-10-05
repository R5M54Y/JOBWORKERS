// JOBWORKERS Saved Search Repository
// Database abstraction for saved search operations (D1/SQLite)

import { SavedSearch, CreateSavedSearchInput, UpdateSavedSearchInput, JobAlert, JobAlertWithDetails } from '../types/savedSearch';

export class SavedSearchRepository {
  constructor(private db: D1Database) {}

  async createSavedSearch(input: CreateSavedSearchInput): Promise<SavedSearch> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(
      `INSERT INTO saved_searches (
        user_id, name, search, source, location, employment_type, category, remote, is_active, last_checked_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      input.user_id,
      input.name.trim(),
      input.search || null,
      input.source || null,
      input.location || null,
      input.employment_type || null,
      input.category || null,
      input.remote ? 1 : 0,
      input.is_active !== false ? 1 : 0,
      now, // last_checked_at = now (baseline: no historical alerts)
      now,
      now
    );

    await stmt.run();
    
    // Fetch the created record (D1 doesn't support RETURNING reliably)
    const result = await this.db.prepare(
      'SELECT * FROM saved_searches WHERE user_id = ? AND name = ?'
    ).bind(input.user_id, input.name.trim()).first<SavedSearch>();
    
    if (!result) throw new Error('Failed to create saved search');
    return result;
  }

  async getSavedSearchById(id: number): Promise<SavedSearch | null> {
    return await this.db.prepare('SELECT * FROM saved_searches WHERE id = ?').bind(id).first<SavedSearch>();
  }

  async listSavedSearchesByUser(userId: number): Promise<SavedSearch[]> {
    const result = await this.db.prepare(
      'SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all<SavedSearch>();
    return result.results || [];
  }

  async countSavedSearchesByUser(userId: number): Promise<number> {
    const result = await this.db.prepare(
      'SELECT COUNT(*) as count FROM saved_searches WHERE user_id = ?'
    ).bind(userId).first<{ count: number }>();
    return result?.count || 0;
  }

  async updateSavedSearch(id: number, input: UpdateSavedSearchInput): Promise<SavedSearch | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      params.push(input.name.trim());
    }

    if (input.search !== undefined) {
      fields.push('search = ?');
      params.push(input.search || null);
    }

    if (input.source !== undefined) {
      fields.push('source = ?');
      params.push(input.source || null);
    }

    if (input.location !== undefined) {
      fields.push('location = ?');
      params.push(input.location || null);
    }

    if (input.employment_type !== undefined) {
      fields.push('employment_type = ?');
      params.push(input.employment_type || null);
    }

    if (input.category !== undefined) {
      fields.push('category = ?');
      params.push(input.category || null);
    }

    if (input.remote !== undefined) {
      fields.push('remote = ?');
      params.push(input.remote ? 1 : 0);
    }

    if (input.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(input.is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.getSavedSearchById(id);
    }

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.prepare(
      `UPDATE saved_searches SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return this.getSavedSearchById(id);
  }

  async deleteSavedSearch(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM saved_searches WHERE id = ?').bind(id).run();
  }

  async updateLastCheckedAt(id: number, timestamp: string): Promise<void> {
    await this.db.prepare(
      'UPDATE saved_searches SET last_checked_at = ?, updated_at = ? WHERE id = ?'
    ).bind(timestamp, new Date().toISOString(), id).run();
  }

  // Alert methods

  async createJobAlert(savedSearchId: number, jobId: number): Promise<void> {
    try {
      await this.db.prepare(
        'INSERT INTO job_alerts (saved_search_id, job_id, created_at) VALUES (?, ?, ?)'
      ).bind(savedSearchId, jobId, new Date().toISOString()).run();
    } catch (error: any) {
      // Ignore duplicate constraint violations (UNIQUE constraint on saved_search_id + job_id)
      if (!error.message?.includes('UNIQUE constraint failed')) {
        throw error;
      }
    }
  }

  async getJobAlertsByUser(userId: number, unreadOnly: boolean = false): Promise<JobAlertWithDetails[]> {
    let query = `
      SELECT 
        ja.id,
        ja.saved_search_id,
        ja.job_id,
        ja.read_at,
        ja.created_at,
        j.title as job_title,
        j.company as job_company,
        j.location as job_location,
        j.url as job_url,
        j.source as job_source,
        j.category as job_category,
        j.employment_type as job_employment_type,
        ss.name as saved_search_name
      FROM job_alerts ja
      JOIN saved_searches ss ON ja.saved_search_id = ss.id
      JOIN jobs j ON ja.job_id = j.id
      WHERE ss.user_id = ?
    `;

    const params: any[] = [userId];

    if (unreadOnly) {
      query += ' AND ja.read_at IS NULL';
    }

    query += ' ORDER BY ja.created_at DESC';

    const result = await this.db.prepare(query).bind(...params).all<JobAlertWithDetails>();
    return result.results || [];
  }

  async getJobAlertById(id: number): Promise<JobAlert | null> {
    return await this.db.prepare('SELECT * FROM job_alerts WHERE id = ?').bind(id).first<JobAlert>();
  }

  async markAlertAsRead(id: number): Promise<void> {
    await this.db.prepare(
      'UPDATE job_alerts SET read_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), id).run();
  }

  async countUnreadAlertsByUser(userId: number): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM job_alerts ja
      JOIN saved_searches ss ON ja.saved_search_id = ss.id
      WHERE ss.user_id = ? AND ja.read_at IS NULL
    `).bind(userId).first<{ count: number }>();
    return result?.count || 0;
  }

  async getActiveSavedSearches(): Promise<SavedSearch[]> {
    const result = await this.db.prepare(
      'SELECT * FROM saved_searches WHERE is_active = 1 ORDER BY last_checked_at ASC'
    ).all<SavedSearch>();
    return result.results || [];
  }
}
