// JOBWORKERS Saved Jobs API Routes
// Endpoints for saving/unsaving jobs

import { Context } from 'hono';
import { SavedJobRepository } from '../repositories/SavedJobRepository';

export async function handleSaveJob(c: Context) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }
    
    const jobId = parseInt(idParam, 10);
    
    if (isNaN(jobId) || jobId < 1) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }

    // Verify job exists
    const jobStmt = c.env.DB.prepare('SELECT id FROM jobs WHERE id = ? LIMIT 1').bind(jobId);
    const job = await jobStmt.first();
    
    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    // Save job (idempotent)
    const repo = new SavedJobRepository(c.env.DB);
    await repo.saveJob(user.id, jobId);

    return c.json({ saved: true });
  } catch (error) {
    const err = error as Error;
    console.error('Save job error:', err);
    return c.json({ error: 'Failed to save job' }, 500);
  }
}

export async function handleRemoveJob(c: Context) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }
    
    const jobId = parseInt(idParam, 10);
    
    if (isNaN(jobId) || jobId < 1) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }

    // Remove job (idempotent)
    const repo = new SavedJobRepository(c.env.DB);
    await repo.removeJob(user.id, jobId);

    return c.json({ saved: false });
  } catch (error) {
    const err = error as Error;
    console.error('Remove job error:', err);
    return c.json({ error: 'Failed to remove saved job' }, 500);
  }
}

export async function handleListSavedJobs(c: Context) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);

    // Validate pagination
    if (page < 1 || isNaN(page)) {
      return c.json({ error: 'Invalid page parameter' }, 400);
    }
    if (limit < 1 || limit > 100 || isNaN(limit)) {
      return c.json({ error: 'Invalid limit parameter' }, 400);
    }

    const repo = new SavedJobRepository(c.env.DB);
    const { jobs, total } = await repo.listSavedJobs(user.id, page, limit);

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
    console.error('List saved jobs error:', err);
    return c.json({ error: 'Failed to list saved jobs' }, 500);
  }
}
