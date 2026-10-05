// JOBWORKERS - Cloudflare Workers Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html } from 'hono/html';
import { initSchema } from './db/client';
import { JobRepository } from './repositories/JobRepository';
import { ScraperService } from './scrapers/ScraperService';
import { handleListJobs, handleGetJob } from './routes/jobs';
import { handleRegister, handleLogin, handleLogout, handleMe } from './routes/auth';
import { handleSaveJob, handleRemoveJob, handleListSavedJobs } from './routes/savedJobs';
import { handleApplyJob, handleListApplications, handleGetApplication, handleUpdateApplicationStatus } from './routes/applications';
import { handleCreateSavedSearch, handleListSavedSearches, handleGetSavedSearch, handleUpdateSavedSearch, handleDeleteSavedSearch, handleListJobAlerts, handleMarkAlertRead } from './routes/savedSearches';
import { authMiddleware, requireAuth } from './middleware/auth';
import { JobListView } from './views/JobList';
import { JobDetailView } from './views/JobDetail';
import { LoginView } from './views/Login';
import { RegisterView } from './views/Register';
import { AccountView } from './views/Account';
import { SavedJobsView } from './views/SavedJobs';
import { ApplicationsView } from './views/Applications';

// Cloudflare environment bindings
type Env = {
  DB: D1Database;
  ADMIN_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// Auth middleware (runs on all requests)
app.use('*', authMiddleware);

// CORS middleware for public API
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Helper: verify admin token
const verifyAdmin = (c: any): boolean => {
  const authHeader = c.req.header('Authorization');
  const expectedToken = `Bearer ${c.env.ADMIN_SECRET}`;
  return authHeader === expectedToken;
};

// ===== FRONTEND ROUTES =====

// Job Explorer - Main page (public)
app.get('/', async (c) => {
try {
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = 20;
  const search = c.req.query('search');
  const location = c.req.query('location');
  const source = c.req.query('source');
  const job_type = c.req.query('job_type');
  const category = c.req.query('category');
  const remote = c.req.query('remote');
  const sort = c.req.query('sort') || 'latest';

  // Build query string for API
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (location) params.set('location', location);
  if (source) params.set('source', source);
  if (job_type) params.set('job_type', job_type);
  if (category) params.set('category', category);
  if (remote) params.set('remote', remote);
  if (sort) params.set('sort', sort);

  // Call internal API
  const apiUrl = `${new URL(c.req.url).origin}/api/jobs?${params.toString()}`;
  const response = await fetch(apiUrl);
  const data = await response.json() as any;

  if (!response.ok) {
    return c.html(html`<div class="error-state">Unable to load jobs. Please try again.</div>`);
    }

    // Fetch available categories
    const categoriesResult = await c.env.DB.prepare(
      'SELECT DISTINCT category FROM jobs WHERE category IS NOT NULL ORDER BY category'
    ).all();
    const availableCategories: string[] = (categoriesResult.results || []).map((r: any) => r.category);

    return c.html(
      JobListView({
        jobs: data.data || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
        filters: {
          search,
          location,
          source,
          job_type,
          category,
          remote: remote === 'true',
          sort,
        },
        availableCategories,
      })
    );
  } catch (error) {
    console.error('Error rendering job list:', error);
    return c.html(html`<div class="error-state">An error occurred. Please try again later.</div>`);
  }
});

// Login page
app.get('/login', (c) => {
  const user = c.get('user');
  if (user) {
    return c.redirect('/account');
  }
  
  const error = c.req.query('error');
  return c.html(LoginView({ error }));
});

// Register page
app.get('/register', (c) => {
  const user = c.get('user');
  if (user) {
    return c.redirect('/account');
  }
  
  const error = c.req.query('error');
  return c.html(RegisterView({ error }));
});

// Account page (protected)
app.get('/account', requireAuth, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(AccountView({ user }));
});

// Saved jobs page (protected)
app.get('/saved-jobs', requireAuth, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.redirect('/login');
  }

  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = 20;

    if (page < 1) {
      return c.redirect('/saved-jobs');
    }

    // Call internal API
    const apiUrl = `${new URL(c.req.url).origin}/api/saved-jobs?page=${page}&limit=${limit}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Cookie': c.req.header('cookie') || '',
      },
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return c.html(html`<div class="error-state">Unable to load saved jobs. Please try again.</div>`);
    }

    return c.html(
      SavedJobsView({
        jobs: data.data || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
        user,
      })
    );
  } catch (error) {
    console.error('Error rendering saved jobs:', error);
    return c.html(html`<div class="error-state">An error occurred. Please try again later.</div>`);
  }
});

// Applications page (protected)
app.get('/applications', requireAuth, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.redirect('/login');
  }

  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = 20;

    if (page < 1) {
      return c.redirect('/applications');
    }

    // Call internal API
    const apiUrl = `${new URL(c.req.url).origin}/api/applications?page=${page}&limit=${limit}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Cookie': c.req.header('cookie') || '',
      },
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return c.html(html`<div class="error-state">Unable to load applications. Please try again.</div>`);
    }

    return c.html(
      ApplicationsView({
        applications: data.applications || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
        user,
      })
    );
  } catch (error) {
    console.error('Error rendering applications:', error);
    return c.html(html`<div class="error-state">An error occurred. Please try again later.</div>`);
  }
});

// Job Detail page
app.get('/jobs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Call internal API
    const apiUrl = `${new URL(c.req.url).origin}/api/jobs/${id}`;
    const response = await fetch(apiUrl);
    
    if (response.status === 404) {
      return c.html(html`<div class="error-state">Job not found</div>`, 404);
    }
    
    if (!response.ok) {
      return c.html(html`<div class="error-state">Unable to load job. Please try again.</div>`);
    }

    const data = await response.json() as any;

    return c.html(
      JobDetailView({
        job: data.data,
      })
    );
  } catch (error) {
    console.error('Error rendering job detail:', error);
    return c.html(html`<div class="error-state">An error occurred. Please try again later.</div>`);
  }
});

// ===== ROOT & HEALTH CHECKS =====

// Health check: API
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Health check: Database connectivity
app.get('/health/db', async (c) => {
  try {
    const stmt = c.env.DB.prepare('SELECT 1 as health');
    const result = await stmt.first<{ health: number }>();
    
    if (result?.health === 1) {
      return c.json({
        status: 'ok',
        database: 'connected',
        type: 'D1',
        timestamp: new Date().toISOString(),
      });
    }
    
    return c.json({
      status: 'error',
      database: 'unhealthy',
      timestamp: new Date().toISOString(),
    }, 500);
  } catch (error) {
    return c.json({
      status: 'error',
      database: 'connection_failed',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// ===== ADMIN ENDPOINTS (PROTECTED) =====

// Database schema initialization endpoint (admin only)
app.post('/admin/init-schema', async (c) => {
  if (!verifyAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await initSchema(c.env.DB);
    
    return c.json({
      status: 'ok',
      message: 'Schema initialized successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    return c.json({
      status: 'error',
      message: 'Schema initialization failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Manual scraper trigger (admin only)
app.post('/admin/scrape', async (c) => {
  if (!verifyAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const scraperService = new ScraperService(c.env.DB);
    
    const result = await scraperService.runAll();
    
    return c.json({
      status: 'ok',
      result,
    });
  } catch (error) {
    const err = error as Error;
    return c.json({
      status: 'error',
      message: 'Scraper execution failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// ===== AUTHENTICATION ROUTES =====

// Register
app.post('/auth/register', async (c) => {
  return handleRegister(c);
});

// Login
app.post('/auth/login', async (c) => {
  return handleLogin(c);
});

// Logout
app.post('/auth/logout', async (c) => {
  return handleLogout(c);
});

// Get current user
app.get('/auth/me', async (c) => {
  return handleMe(c);
});

// ===== SAVED JOBS ENDPOINTS =====

// Save a job
app.post('/api/jobs/:id/save', async (c) => {
  return handleSaveJob(c);
});

// Remove a saved job
app.delete('/api/jobs/:id/save', async (c) => {
  return handleRemoveJob(c);
});

// List saved jobs for authenticated user
app.get('/api/saved-jobs', async (c) => {
  return handleListSavedJobs(c);
});

// ===== JOB APPLICATION ENDPOINTS =====

// Apply to a job
app.post('/api/jobs/:id/apply', async (c) => {
  return handleApplyJob(c);
});

// List user's applications
app.get('/api/applications', async (c) => {
  return handleListApplications(c);
});

// Get single application
app.get('/api/applications/:id', async (c) => {
  return handleGetApplication(c);
});

// Update application status
app.patch('/api/applications/:id', async (c) => {
  return handleUpdateApplicationStatus(c);
});

// ===== SAVED SEARCH ENDPOINTS =====

// Create saved search
app.post('/api/saved-searches', async (c) => {
  return handleCreateSavedSearch(c);
});

// List saved searches
app.get('/api/saved-searches', async (c) => {
  return handleListSavedSearches(c);
});

// Get saved search
app.get('/api/saved-searches/:id', async (c) => {
  return handleGetSavedSearch(c);
});

// Update saved search
app.patch('/api/saved-searches/:id', async (c) => {
  return handleUpdateSavedSearch(c);
});

// Delete saved search
app.delete('/api/saved-searches/:id', async (c) => {
  return handleDeleteSavedSearch(c);
});

// ===== JOB ALERT ENDPOINTS =====

// List job alerts
app.get('/api/job-alerts', async (c) => {
  return handleListJobAlerts(c);
});

// Mark alert as read
app.patch('/api/job-alerts/:id', async (c) => {
  return handleMarkAlertRead(c);
});

// ===== PUBLIC API ENDPOINTS =====

// List jobs with pagination, filtering, search, sorting
app.get('/api/jobs', async (c) => {
  return handleListJobs(c, c.env.DB);
});

// Get single job by ID
app.get('/api/jobs/:id', async (c) => {
  return handleGetJob(c, c.env.DB);
});

// ===== SCHEDULED HANDLER =====

export default {
  fetch: app.fetch,
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered:', event.scheduledTime);
    
    ctx.waitUntil(
      (async () => {
        try {
          const scraperService = new ScraperService(env.DB);
          
          const result = await scraperService.runAll();
          
          console.log('Scraper pipeline completed:', JSON.stringify(result.summary));

          // Evaluate saved searches and create alerts
          const { SavedSearchAlertService } = await import('./services/SavedSearchAlertService');
          const { SavedSearchRepository } = await import('./repositories/SavedSearchRepository');
          
          const alertRepo = new SavedSearchRepository(env.DB);
          const alertService = new SavedSearchAlertService(env.DB, alertRepo);
          
          const alertResult = await alertService.evaluateAllSavedSearches();
          console.log('Alert evaluation completed:', JSON.stringify(alertResult));
        } catch (error) {
          console.error('Scraper pipeline failed:', error);
        }
      })()
    );
  },
};
