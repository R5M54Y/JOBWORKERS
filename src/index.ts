// JOBWORKERS - Cloudflare Workers Entry Point
import { Hono } from 'hono';
import { initSchema } from './db/client';
import { JobRepository } from './repositories/JobRepository';
import { ScraperService } from './scrapers/ScraperService';

// Cloudflare environment bindings
type Env = {
  DB: D1Database;
  ADMIN_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// Helper: verify admin token
const verifyAdmin = (c: any): boolean => {
  const authHeader = c.req.header('Authorization');
  const expectedToken = `Bearer ${c.env.ADMIN_SECRET}`;
  return authHeader === expectedToken;
};

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'JOBWORKERS',
    runtime: 'Cloudflare Workers',
    database: 'D1',
    timestamp: new Date().toISOString(),
  });
});

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

// Scheduled handler for daily scraping
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
