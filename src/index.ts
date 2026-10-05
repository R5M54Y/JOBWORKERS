// JOBWORKERS - Cloudflare Workers Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html } from 'hono/html';
import { initSchema } from './db/client';
import { JobRepository } from './repositories/JobRepository';
import { ScraperService } from './scrapers/ScraperService';
import { handleListJobs, handleGetJob } from './routes/jobs';
import { JobListView } from './views/JobList';
import { JobDetailView } from './views/JobDetail';

// Cloudflare environment bindings
type Env = {
  DB: D1Database;
  ADMIN_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

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

// Job Explorer - Main page
app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = 20;
    const search = c.req.query('search');
    const location = c.req.query('location');
    const source = c.req.query('source');
    const job_type = c.req.query('job_type');
    const category = c.req.query('category');
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
    if (sort) params.set('sort', sort);

    // Call internal API
    const apiUrl = `${new URL(c.req.url).origin}/api/jobs?${params.toString()}`;
    const response = await fetch(apiUrl);
    const data = await response.json() as any;

    if (!response.ok) {
      return c.html(html`<div class="error-state">Unable to load jobs. Please try again.</div>`);
    }

    return c.html(
      JobListView({
        jobs: data.data || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
        filters: { search, location, source, job_type, category, sort },
      })
    );
  } catch (error) {
    console.error('Error rendering job list:', error);
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
        } catch (error) {
          console.error('Scraper pipeline failed:', error);
        }
      })()
    );
  },
};
