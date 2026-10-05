// JOBWORKERS Saved Job Repository
// Database operations for saved jobs

export interface SavedJob {
  id: number;
  user_id: number;
  job_id: number;
  created_at: string;
}

export class SavedJobRepository {
  constructor(private db: D1Database) {}

  async saveJob(userId: number, jobId: number): Promise<void> {
    try {
      const stmt = this.db.prepare(
        `INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)`
      ).bind(userId, jobId);
      
      await stmt.run();
    } catch (error) {
      console.error('Save job error:', error);
      throw new Error('Failed to save job');
    }
  }

  async removeJob(userId: number, jobId: number): Promise<void> {
    try {
      const stmt = this.db.prepare(
        `DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?`
      ).bind(userId, jobId);
      
      await stmt.run();
    } catch (error) {
      console.error('Remove saved job error:', error);
      throw new Error('Failed to remove saved job');
    }
  }

  async isSaved(userId: number, jobId: number): Promise<boolean> {
    try {
      const stmt = this.db.prepare(
        `SELECT 1 FROM saved_jobs WHERE user_id = ? AND job_id = ? LIMIT 1`
      ).bind(userId, jobId);
      
      const result = await stmt.first<{ '1': number }>();
      return result !== null;
    } catch (error) {
      console.error('Check saved job error:', error);
      return false;
    }
  }

  async listSavedJobs(userId: number, page: number, limit: number): Promise<{
    jobs: any[];
    total: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Get paginated jobs
      const jobsStmt = this.db.prepare(
        `SELECT 
          j.id,
          j.source,
          j.source_job_id,
          j.title,
          j.company,
          j.location,
          j.description,
          j.url,
          j.category,
          j.employment_type,
          j.salary_min,
          j.salary_max,
          j.created_at,
          s.created_at as saved_at
        FROM saved_jobs s
        JOIN jobs j ON j.id = s.job_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?`
      ).bind(userId, limit, offset);

      const jobs = await jobsStmt.all<any>();

      // Get total count
      const countStmt = this.db.prepare(
        `SELECT COUNT(*) as count FROM saved_jobs WHERE user_id = ?`
      ).bind(userId);

      const countResult = await countStmt.first<{ count: number }>();
      const total = countResult?.count || 0;

      return {
        jobs: jobs.results || [],
        total,
      };
    } catch (error) {
      console.error('List saved jobs error:', error);
      throw new Error('Failed to list saved jobs');
    }
  }

  async countSavedJobs(userId: number): Promise<number> {
    try {
      const stmt = this.db.prepare(
        `SELECT COUNT(*) as count FROM saved_jobs WHERE user_id = ?`
      ).bind(userId);

      const result = await stmt.first<{ count: number }>();
      return result?.count || 0;
    } catch (error) {
      console.error('Count saved jobs error:', error);
      return 0;
    }
  }
}
