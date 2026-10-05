// JOBWORKERS Public Job API Routes
// Read-only endpoints for job listing and detail

import { Context } from 'hono';
import { JobRepository } from '../repositories/JobRepository';
import { ListJobsFilters } from '../types/job';

// Validation helpers
function validatePage(page: string | undefined): { valid: boolean; value: number; error?: string } {
  if (!page) return { valid: true, value: 1 };
  const num = parseInt(page, 10);
  if (isNaN(num) || num < 1) {
    return { valid: false, value: 1, error: 'page must be a positive integer' };
  }
  return { valid: true, value: num };
}

function validateLimit(limit: string | undefined): { valid: boolean; value: number; error?: string } {
  if (!limit) return { valid: true, value: 20 };
  const num = parseInt(limit, 10);
  if (isNaN(num) || num < 1 || num > 100) {
    return { valid: false, value: 20, error: 'limit must be between 1 and 100' };
  }
  return { valid: true, value: num };
}

function validateSort(sort: string | undefined): { valid: boolean; value: 'latest' | 'oldest'; error?: string } {
  if (!sort) return { valid: true, value: 'latest' };
  if (sort !== 'latest' && sort !== 'oldest') {
    return { valid: false, value: 'latest', error: 'sort must be "latest" or "oldest"' };
  }
  return { valid: true, value: sort };
}

export async function handleListJobs(c: Context, db: D1Database) {
  try {
    // Parse and validate query parameters
    const pageParam = c.req.query('page');
    const limitParam = c.req.query('limit');
    const sortParam = c.req.query('sort');
    const source = c.req.query('source');
    const location = c.req.query('location');
    const jobType = c.req.query('job_type');
    const category = c.req.query('category');
    const search = c.req.query('search');

    const pageValidation = validatePage(pageParam);
    if (!pageValidation.valid) {
      return c.json({ error: pageValidation.error }, 400);
    }

    const limitValidation = validateLimit(limitParam);
    if (!limitValidation.valid) {
      return c.json({ error: limitValidation.error }, 400);
    }

    const sortValidation = validateSort(sortParam);
    if (!sortValidation.valid) {
      return c.json({ error: sortValidation.error }, 400);
    }

    const page = pageValidation.value;
    const limit = limitValidation.value;
    const sort = sortValidation.value;
    const offset = (page - 1) * limit;

    // Build filters
    const filters: ListJobsFilters & { search?: string; sort?: 'latest' | 'oldest' } = {
      limit,
      offset,
    };

    if (source) filters.source = source;
    if (location) filters.location = location;
    if (jobType) filters.employment_type = jobType;
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (sort) filters.sort = sort;

    const repository = new JobRepository(db);

    // Get total count
    const totalResult = await db
      .prepare('SELECT COUNT(*) as count FROM jobs')
      .first<{ count: number }>();
    const total = totalResult?.count || 0;

    // Get paginated jobs with filters and search
    const jobs = await listJobsWithSearch(db, filters);

    const totalPages = Math.ceil(total / limit);

    return c.json({
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error listing jobs:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

export async function handleGetJob(c: Context, db: D1Database) {
  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }
    
    const id = parseInt(idParam, 10);

    if (isNaN(id) || id < 1) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }

    const repository = new JobRepository(db);
    const job = await repository.getJobById(id);

    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    return c.json({ data: job });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching job:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

// Helper: List jobs with advanced filtering and search
async function listJobsWithSearch(
  db: D1Database,
  filters: ListJobsFilters & { search?: string; sort?: 'latest' | 'oldest' }
): Promise<any[]> {
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

  // Full-text search on title, company, description
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push('(title LIKE ? OR company LIKE ? OR description LIKE ?)');
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause =
    filters.sort === 'oldest'
      ? 'ORDER BY created_at ASC'
      : 'ORDER BY created_at DESC';

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;

  params.push(limit, offset);

  const stmt = db.prepare(
    `SELECT * FROM jobs ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
  ).bind(...params);

  const result = await stmt.all<any>();
  return result.results || [];
}
