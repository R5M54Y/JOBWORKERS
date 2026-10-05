// JOBWORKERS Job Application Routes
// API endpoints for job application tracking

import { Context } from 'hono';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository';
import type { ApplicationStatus } from '../types/application';

const VALID_STATUSES: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected'];

export async function handleApplyJob(c: Context) {
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

    // Check if already applied
    const repo = new JobApplicationRepository(c.env.DB);
    const exists = await repo.isApplicationExists(user.id, jobId);
    
    if (exists) {
      return c.json({ error: 'Application already exists' }, 409);
    }

    // Create application
    const application = await repo.createApplication(user.id, jobId, 'applied');

    return c.json(application, 201);
  } catch (error) {
    const err = error as Error;
    console.error('Apply job error:', err);
    return c.json({ error: 'Failed to create application' }, 500);
  }
}

export async function handleListApplications(c: Context) {
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

    const repo = new JobApplicationRepository(c.env.DB);
    const { applications, total } = await repo.listApplicationsByUser(user.id, page, limit);

    const totalPages = Math.ceil(total / limit);

    return c.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('List applications error:', err);
    return c.json({ error: 'Failed to list applications' }, 500);
  }
}

export async function handleGetApplication(c: Context) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid application ID' }, 400);
    }

    const appId = parseInt(idParam, 10);
    
    if (isNaN(appId) || appId < 1) {
      return c.json({ error: 'Invalid application ID' }, 400);
    }

    const repo = new JobApplicationRepository(c.env.DB);
    const application = await repo.getApplicationById(appId, user.id);

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    return c.json(application);
  } catch (error) {
    const err = error as Error;
    console.error('Get application error:', err);
    return c.json({ error: 'Failed to fetch application' }, 500);
  }
}

export async function handleUpdateApplicationStatus(c: Context) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid application ID' }, 400);
    }

    const appId = parseInt(idParam, 10);
    
    if (isNaN(appId) || appId < 1) {
      return c.json({ error: 'Invalid application ID' }, 400);
    }

    const body = await c.req.json<{ status?: string }>();
    const newStatus = body?.status;

    if (!newStatus) {
      return c.json({ error: 'Status is required' }, 400);
    }

    if (!VALID_STATUSES.includes(newStatus as ApplicationStatus)) {
      return c.json({ 
        error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}` 
      }, 400);
    }

    const repo = new JobApplicationRepository(c.env.DB);
    const application = await repo.updateApplicationStatus(appId, user.id, newStatus);

    return c.json(application);
  } catch (error) {
    const err = error as Error;
    console.error('Update application error:', err);
    return c.json({ error: 'Failed to update application' }, 500);
  }
}
