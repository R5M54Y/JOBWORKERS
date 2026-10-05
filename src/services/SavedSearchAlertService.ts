// JOBWORKERS Saved Search Alert Service
// Business logic for evaluating saved searches and creating job alerts

import { SavedSearchRepository } from '../repositories/SavedSearchRepository';
import { SavedSearch } from '../types/savedSearch';
import { ListJobsFilters } from '../types/job';

interface AlertEvaluationResult {
  searches_evaluated: number;
  alerts_created: number;
  errors: number;
}

export class SavedSearchAlertService {
  constructor(
    private db: D1Database,
    private savedSearchRepo: SavedSearchRepository
  ) {}

  /**
   * Evaluate all active saved searches and create alerts for new matching jobs
   */
  async evaluateAllSavedSearches(): Promise<AlertEvaluationResult> {
    const result: AlertEvaluationResult = {
      searches_evaluated: 0,
      alerts_created: 0,
      errors: 0,
    };

    try {
      const savedSearches = await this.savedSearchRepo.getActiveSavedSearches();
      
      for (const search of savedSearches) {
        try {
          const alertsCreated = await this.evaluateSingleSearch(search);
          result.searches_evaluated++;
          result.alerts_created += alertsCreated;
        } catch (error) {
          console.error(`Failed to evaluate saved search ${search.id}:`, error);
          result.errors++;
          // Continue processing other searches
        }
      }
    } catch (error) {
      console.error('Failed to fetch active saved searches:', error);
      result.errors++;
    }

    return result;
  }

  /**
   * Evaluate a single saved search and create alerts for new matching jobs
   */
  private async evaluateSingleSearch(search: SavedSearch): Promise<number> {
    // Find jobs created after last_checked_at
    const filters: ListJobsFilters & { search?: string; remote?: boolean } = {
      status: 'active',
    };

    // Apply saved search filters
    if (search.search) filters.search = search.search;
    if (search.source) filters.source = search.source;
    if (search.location) filters.location = search.location;
    if (search.employment_type) filters.employment_type = search.employment_type;
    if (search.category) filters.category = search.category;
    if (search.remote === 1) filters.remote = true;

    // Build WHERE conditions using the same logic as job search API
    const conditions: string[] = ['status = ?'];
    const params: any[] = ['active'];

    // New jobs only: created_at > last_checked_at
    conditions.push('created_at > ?');
    params.push(search.last_checked_at);

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

    if (filters.search) {
      conditions.push('(title LIKE ? OR company LIKE ? OR description LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters.remote === true) {
      conditions.push('LOWER(location) LIKE ?');
      params.push('%remote%');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Fetch matching jobs
    const stmt = this.db.prepare(
      `SELECT id FROM jobs ${whereClause} ORDER BY created_at DESC LIMIT 100`
    ).bind(...params);

    const result = await stmt.all<{ id: number }>();
    const matchingJobs = result.results || [];

    // Create alerts for matching jobs
    let alertsCreated = 0;
    for (const job of matchingJobs) {
      try {
        await this.savedSearchRepo.createJobAlert(search.id, job.id);
        alertsCreated++;
      } catch (error) {
        // Duplicate alerts are ignored by repository
        // Log other errors but continue
        if (error instanceof Error && !error.message.includes('UNIQUE')) {
          console.error(`Failed to create alert for job ${job.id}:`, error);
        }
      }
    }

    // Update last_checked_at to now
    const now = new Date().toISOString();
    await this.savedSearchRepo.updateLastCheckedAt(search.id, now);

    return alertsCreated;
  }
}
