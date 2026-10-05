// JOBWORKERS Job Application Repository
// Database operations for job applications

import type { JobApplication, ApplicationWithJob } from '../types/application';
import { STATUS_MAP, REVERSE_STATUS_MAP } from '../types/application';

export class JobApplicationRepository {
  constructor(private db: D1Database) {}

  async createApplication(userId: number, jobId: number, status: string = 'applied'): Promise<JobApplication> {
    try {
      const dbStatus = STATUS_MAP[status as keyof typeof STATUS_MAP] || 'pending';
      
      const stmt = this.db.prepare(
        `INSERT INTO job_applications (user_id, job_id, status, applied_via)
         VALUES (?, ?, ?, 'internal')
         ON CONFLICT(job_id, user_id) DO UPDATE SET updated_at = datetime('now')`
      ).bind(userId, jobId, dbStatus);
      
      await stmt.run();

      // Fetch the created/updated record
      return this.getApplicationByUserAndJob(userId, jobId);
    } catch (error) {
      console.error('Create application error:', error);
      throw new Error('Failed to create application');
    }
  }

  async getApplicationById(id: number, userId: number): Promise<ApplicationWithJob | null> {
    try {
      const stmt = this.db.prepare(
        `SELECT 
          ja.id,
          ja.user_id,
          ja.job_id,
          ja.status,
          ja.notes,
          ja.external_id,
          ja.applied_via,
          ja.status_history,
          ja.applied_at,
          ja.updated_at,
          j.id as job_id,
          j.title as job_title,
          j.company as job_company,
          j.location as job_location,
          j.source as job_source,
          j.url as job_url
        FROM job_applications ja
        LEFT JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND ja.user_id = ?
        LIMIT 1`
      ).bind(id, userId);
      
      const result = await stmt.first<any>();
      
      if (!result) return null;

      return {
        id: result.id,
        user_id: result.user_id,
        job_id: result.job_id,
        status: REVERSE_STATUS_MAP[result.status] || result.status,
        notes: result.notes,
        external_id: result.external_id,
        applied_via: result.applied_via,
        status_history: result.status_history,
        applied_at: result.applied_at,
        updated_at: result.updated_at,
        job: {
          id: result.job_id,
          title: result.job_title,
          company: result.job_company,
          location: result.job_location,
          source: result.job_source,
          url: result.job_url,
        },
      };
    } catch (error) {
      console.error('Get application error:', error);
      return null;
    }
  }

  async getApplicationByUserAndJob(userId: number, jobId: number): Promise<ApplicationWithJob> {
    try {
      const stmt = this.db.prepare(
        `SELECT 
          ja.id,
          ja.user_id,
          ja.job_id,
          ja.status,
          ja.notes,
          ja.external_id,
          ja.applied_via,
          ja.status_history,
          ja.applied_at,
          ja.updated_at,
          j.id as job_id,
          j.title as job_title,
          j.company as job_company,
          j.location as job_location,
          j.source as job_source,
          j.url as job_url
        FROM job_applications ja
        LEFT JOIN jobs j ON ja.job_id = j.id
        WHERE ja.user_id = ? AND ja.job_id = ?
        LIMIT 1`
      ).bind(userId, jobId);
      
      const result = await stmt.first<any>();
      
      if (!result) throw new Error('Application not found');

      return {
        id: result.id,
        user_id: result.user_id,
        job_id: result.job_id,
        status: REVERSE_STATUS_MAP[result.status] || result.status,
        notes: result.notes,
        external_id: result.external_id,
        applied_via: result.applied_via,
        status_history: result.status_history,
        applied_at: result.applied_at,
        updated_at: result.updated_at,
        job: {
          id: result.job_id,
          title: result.job_title,
          company: result.job_company,
          location: result.job_location,
          source: result.job_source,
          url: result.job_url,
        },
      };
    } catch (error) {
      console.error('Get application by user/job error:', error);
      throw new Error('Failed to fetch application');
    }
  }

  async listApplicationsByUser(userId: number, page: number, limit: number): Promise<{
    applications: ApplicationWithJob[];
    total: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const stmt = this.db.prepare(
        `SELECT 
          ja.id,
          ja.user_id,
          ja.job_id,
          ja.status,
          ja.notes,
          ja.external_id,
          ja.applied_via,
          ja.status_history,
          ja.applied_at,
          ja.updated_at,
          j.id as job_id,
          j.title as job_title,
          j.company as job_company,
          j.location as job_location,
          j.source as job_source,
          j.url as job_url
        FROM job_applications ja
        LEFT JOIN jobs j ON ja.job_id = j.id
        WHERE ja.user_id = ?
        ORDER BY ja.applied_at DESC
        LIMIT ? OFFSET ?`
      ).bind(userId, limit, offset);
      
      const result = await stmt.all<any>();

      const countStmt = this.db.prepare(
        `SELECT COUNT(*) as count FROM job_applications WHERE user_id = ?`
      ).bind(userId);

      const countResult = await countStmt.first<{ count: number }>();
      const total = countResult?.count || 0;

      const applications = (result.results || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        job_id: row.job_id,
        status: REVERSE_STATUS_MAP[row.status] || row.status,
        notes: row.notes,
        external_id: row.external_id,
        applied_via: row.applied_via,
        status_history: row.status_history,
        applied_at: row.applied_at,
        updated_at: row.updated_at,
        job: {
          id: row.job_id,
          title: row.job_title,
          company: row.job_company,
          location: row.job_location,
          source: row.job_source,
          url: row.job_url,
        },
      }));

      return { applications, total };
    } catch (error) {
      console.error('List applications error:', error);
      throw new Error('Failed to list applications');
    }
  }

  async updateApplicationStatus(id: number, userId: number, status: string): Promise<ApplicationWithJob> {
    try {
      const dbStatus = STATUS_MAP[status as keyof typeof STATUS_MAP] || 'pending';

      const stmt = this.db.prepare(
        `UPDATE job_applications
         SET status = ?, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`
      ).bind(dbStatus, id, userId);
      
      await stmt.run();

      // Fetch updated application
      const fetchStmt = this.db.prepare(
        `SELECT 
          ja.id,
          ja.user_id,
          ja.job_id,
          ja.status,
          ja.notes,
          ja.external_id,
          ja.applied_via,
          ja.status_history,
          ja.applied_at,
          ja.updated_at,
          j.id as job_id,
          j.title as job_title,
          j.company as job_company,
          j.location as job_location,
          j.source as job_source,
          j.url as job_url
        FROM job_applications ja
        LEFT JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND ja.user_id = ?
        LIMIT 1`
      ).bind(id, userId);

      const result = await fetchStmt.first<any>();

      if (!result) throw new Error('Application not found');

      return {
        id: result.id,
        user_id: result.user_id,
        job_id: result.job_id,
        status: REVERSE_STATUS_MAP[result.status] || result.status,
        notes: result.notes,
        external_id: result.external_id,
        applied_via: result.applied_via,
        status_history: result.status_history,
        applied_at: result.applied_at,
        updated_at: result.updated_at,
        job: {
          id: result.job_id,
          title: result.job_title,
          company: result.job_company,
          location: result.job_location,
          source: result.job_source,
          url: result.job_url,
        },
      };
    } catch (error) {
      console.error('Update application error:', error);
      throw new Error('Failed to update application');
    }
  }

  async countApplicationsByUser(userId: number): Promise<number> {
    try {
      const stmt = this.db.prepare(
        `SELECT COUNT(*) as count FROM job_applications WHERE user_id = ?`
      ).bind(userId);

      const result = await stmt.first<{ count: number }>();
      return result?.count || 0;
    } catch (error) {
      console.error('Count applications error:', error);
      return 0;
    }
  }

  async isApplicationExists(userId: number, jobId: number): Promise<boolean> {
    try {
      const stmt = this.db.prepare(
        `SELECT 1 FROM job_applications WHERE user_id = ? AND job_id = ? LIMIT 1`
      ).bind(userId, jobId);

      const result = await stmt.first<{ '1': number }>();
      return result !== null;
    } catch (error) {
      console.error('Check application exists error:', error);
      return false;
    }
  }
}
