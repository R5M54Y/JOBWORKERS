// JOBWORKERS - Cloudflare Workers Entry Point
import { Hono } from 'hono';
import { createPool, initSchema } from './db/client';
import { JobRepository } from './repositories/JobRepository';
import { ScraperService } from './scrapers/ScraperService';

// Cloudflare environment bindings
type Env = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'JOBWORKERS',
    runtime: 'Cloudflare Workers',
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
    const pool = createPool(c.env.DATABASE_URL);
    const result = await pool.query('SELECT 1 as health');
    
    if (result.rows[0]?.health === 1) {
      return c.json({
        status: 'ok',
        database: 'connected',
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

// Database schema initialization endpoint (admin only, protected)
app.post('/admin/init-schema', async (c) => {
  try {
    const pool = createPool(c.env.DATABASE_URL);
    await initSchema(pool);
    
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
  try {
    const pool = createPool(c.env.DATABASE_URL);
    const scraperService = new ScraperService(pool);
    
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
          const pool = createPool(env.DATABASE_URL);
          const scraperService = new ScraperService(pool);
          
          const result = await scraperService.runAll();
          
          console.log('Scraper pipeline completed:', JSON.stringify(result.summary));
        } catch (error) {
          console.error('Scraper pipeline failed:', error);
        }
      })()
    );
  },
};
