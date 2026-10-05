# JOBWORKERS Deployment Pre-Flight Checklist

## Security Adjustments

✅ `/admin/init-schema` - requires Authorization header (Bearer token)
✅ `/admin/scrape` - requires Authorization header (Bearer token)
✅ Token format: `Authorization: Bearer ${ADMIN_SECRET}`

## Deployment Steps

### 1. Set ADMIN_SECRET (Cloudflare Workers)

```bash
wrangler secret put ADMIN_SECRET
# Enter a strong secret (e.g., 32+ random characters)
# This protects /admin endpoints
```

### 2. Set DATABASE_URL (Neon Postgres)

```bash
wrangler secret put DATABASE_URL
# Paste Neon connection string:
# postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### 3. Deploy Worker

```bash
wrangler deploy
```

Expected output:
```
✅ Deployed to https://jobworkers.your-subdomain.workers.dev
```

### 4. Initialize Schema (one-time)

```bash
ADMIN_SECRET="your-secret-from-step-1"

curl -X POST https://jobworkers.your-subdomain.workers.dev/admin/init-schema \
  -H "Authorization: Bearer ${ADMIN_SECRET}"
```

Expected: `{"status":"ok","message":"Schema initialized successfully",...}`

### 5. Verify Health Checks

```bash
# API health
curl https://jobworkers.your-subdomain.workers.dev/health
# Expected: {"status":"ok",...}

# Database health
curl https://jobworkers.your-subdomain.workers.dev/health/db
# Expected: {"status":"ok","database":"connected",...}
```

### 6. Trigger Scraper

```bash
curl -X POST https://jobworkers.your-subdomain.workers.dev/admin/scrape \
  -H "Authorization: Bearer ${ADMIN_SECRET}"
```

Expected response:
```json
{
  "status": "ok",
  "result": {
    "started_at": "...",
    "completed_at": "...",
    "total_duration_ms": 5432,
    "providers": [
      {
        "provider": "remoteok",
        "fetched": 42,
        "inserted": 35,
        "updated": 4,
        "skipped": 3,
        "failed": 0,
        ...
      },
      ...
    ],
    "summary": {
      "total_fetched": 120,
      "total_inserted": 95,
      "total_updated": 18,
      "total_skipped": 5,
      "total_failed": 2
    }
  }
}
```

## Verification Checklist

After deployment:

- [ ] /health returns 200
- [ ] /health/db returns 200 + database: "connected"
- [ ] /admin/scrape with valid token returns provider metrics
- [ ] /admin/scrape without token returns 401
- [ ] Jobs inserted into Neon (query: SELECT COUNT(*) FROM jobs)
- [ ] UNIQUE(source, source_job_id) prevents duplicates
- [ ] created_at/updated_at populated
- [ ] Provider failures isolated (one bad provider doesn't block others)
- [ ] Malformed jobs counted as "skipped" not "failed"

## Neon Verification Queries

```sql
-- Count jobs by source
SELECT source, COUNT(*) FROM jobs GROUP BY source;

-- Check for duplicates (should be 0 or valid updates)
SELECT source, source_job_id, COUNT(*) 
FROM jobs 
GROUP BY source, source_job_id 
HAVING COUNT(*) > 1;

-- Sample job
SELECT id, source, title, company, url, created_at 
FROM jobs 
LIMIT 5;

-- Check timestamps
SELECT 
  MIN(created_at) as oldest_job,
  MAX(created_at) as newest_job,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_update_lag_sec
FROM jobs;
```

## Cron Verification

After 24h (or when cron trigger runs):

```bash
wrangler tail --filter "Cron triggered" --format pretty
```

Expected logs:
```
Cron triggered: 2026-10-06T00:00:00.000Z
[remoteok] Fetched 42 jobs
[remoteok] Inserted: 35, Updated: 4, Skipped: 3, Failed: 0
[remotive] Fetched 38 jobs
...
Scraper pipeline completed: {total_fetched: 120, total_inserted: 95, ...}
```

## Rollback Plan

If deployment fails:

```bash
# Revert to previous version (if available)
wrangler rollback

# Or redeploy from git
git checkout HEAD~1
wrangler deploy
```

---

Ready for live deployment.
