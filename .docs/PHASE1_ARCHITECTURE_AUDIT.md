# JOBWORKERS Phase 1: Architecture Audit

**Date:** 2026-10-05  
**Objective:** Understand JOBFORGE, compare JOBWORKERS state, produce Cloudflare architecture decision

---

## 1. JOBFORGE Product Requirements (Preserved)

### Core Product
- Remote job aggregator
- 3 sources: RemoteOK, Remotive, Jobicy
- PostgreSQL storage (jobs table)
- Next.js frontend (listing + detail + search/filter)
- Automated scraping (daily)
- SEO-friendly (metadata, structured data, sitemaps)

### Data Model
```sql
jobs (
  id TEXT PRIMARY KEY,              -- composite: source-sourceJobId
  source TEXT NOT NULL,
  source_job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Remote',
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  employment_type TEXT DEFAULT 'full-time',
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_job_id)
)
```

### Scraper Pipeline
```
Source API → Fetch → Normalize → Validate → Deduplicate → Upsert
```

**Sources:**
- RemoteOK: `https://remoteok.com/api`
- Remotive: `https://remotive.com/api/remote-jobs`
- Jobicy: Custom scraper

**Metrics per source:**
- Fetched
- Normalized
- Valid
- Rejected
- Duplicates removed
- Upserted
- Failed

### Frontend
- Homepage: job listing with search/filter
- Job detail: `/jobs/[id]` (composite ID: remotive-2091144)
- Filters: keyword, location, category, employment_type
- Pagination
- SEO: title, meta, Open Graph, JobPosting JSON-LD

---

## 2. JOBFORGE Architecture (Current Implementation)

### Deployment: Vercel
- **Frontend:** Next.js 14 (App Router)
- **Database:** PostgreSQL (via DATABASE_URL)
- **Scraper:** Standalone TypeScript project
- **Cron:** Vercel Cron (daily via `/api/cron/scrape`)
- **Embedding:** Scraper source bundled in `frontend/scraper/src/`

**Key Files:**
```
frontend/
├── app/
│   ├── page.tsx                    # Homepage (listing)
│   ├── jobs/[id]/page.tsx          # Job detail
│   ├── api/
│   │   ├── jobs/route.ts           # API: list jobs
│   │   ├── cron/scrape/route.ts    # Cron endpoint (imports scraper)
│   └── sitemap-jobs.xml/route.ts   # Dynamic sitemap
├── lib/
│   ├── db.ts                       # PostgreSQL pool + JobRepository
│   ├── types.ts                    # Job interface
│   └── slugify.ts                  # URL utilities
├── scraper/                        # Embedded scraper source
│   └── src/
│       ├── index.ts                # Main pipeline
│       ├── sources.ts              # RemoteOK, Remotive, Jobicy
│       ├── normalize.ts
│       ├── validate.ts
│       ├── deduplicate.ts
│       └── db.ts
└── package.json

scraper/                            # Standalone (for manual runs)
├── src/                            # Identical to frontend/scraper/src
└── package.json
```

**Critical Pattern:**
- Cron route imports scraper via: `import { run } from '../../../../scraper/src/index'`
- Next.js webpack bundles scraper TypeScript source directly into serverless function
- No `dist/` dependency in production
- Scraper runs in Vercel Function runtime (Node.js 20)

### Technology Stack
- Next.js 14.2.5
- React 18.3.1
- TypeScript 5.5.0
- PostgreSQL (pg 8.13.0)
- Bootstrap 5.3.8
- Node.js 20 (Vercel runtime)

---

## 3. JOBWORKERS Repository State

**Current status:** Empty repository (initialized)

```bash
$ ls -la /d/JOBWORKERS
total 8
drwxr-xr-x 1 yekad 197609 0 Oct  5 17:22 .
drwxr-xr-x 1 yekad 197609 0 Oct  5 17:22 ..
```

**Git remote:** https://github.com/R5M54Y/JOBWORKERS.git

---

## 4. Cloudflare Workers Compatibility Audit

### Target Runtime: Cloudflare Workers
- V8 isolates (not Node.js)
- Subset of Web APIs
- No filesystem access
- No native Node modules
- Request/Response via Fetch API
- Environment variables via `env` binding

### Next.js on Cloudflare Workers

**Option 1: OpenNext (Cloudflare Adapter)**
- https://opennext.js.org/cloudflare
- Next.js 14+ support
- Converts Next.js build → Workers-compatible format
- Known limitations:
  - Complex build process
  - Limited App Router features
  - Edge runtime constraints
  - Community adapter (not official)

**Option 2: Next.js Edge Runtime**
- Official Next.js edge runtime
- Subset of Next.js features
- Strict Web API compliance
- No `pg` module (Node.js-only)
- Must use HTTP-based database access (e.g., Neon HTTP, Postgres over HTTP)

**Option 3: Native Cloudflare Workers (No Next.js)**
- Hono or similar minimal framework
- Full control over routing
- Direct D1 (SQLite) or HTTP Postgres
- No SSR complexity
- Manual frontend build

### Database Options on Cloudflare

**PostgreSQL:**
- **Neon HTTP API** — REST/HTTP access to Postgres
- **Hyperdrive** — Connection pooling for Postgres (requires TCP)
- **Direct TCP** — Not available in Workers (use Durable Objects for TCP proxy)

**D1 (SQLite):**
- Native Cloudflare
- Limited to SQLite feature set
- No full-text search (trigram, tsvector)
- Schema differences from PostgreSQL

**R2 (Object Storage):**
- Not suitable for job database

### Scraper Compatibility

**Node.js Dependencies in JOBFORGE Scraper:**
- `pg` (PostgreSQL client) — **Node.js-only**
- `dotenv` — Workers use `env` binding
- `fetch` — Native in Workers (Web API)

**Required Changes:**
- Replace `pg` with HTTP-based Postgres client (Neon, Vercel Postgres)
- Remove `dotenv`, use `env` binding
- Ensure all dependencies are Workers-compatible

### Cron on Cloudflare

**Cron Triggers:**
- Native Cloudflare feature
- Configured in `wrangler.toml`
- Example:
```toml
[triggers]
crons = ["0 0 * * *"]  # Daily at midnight UTC
```

**Execution:**
- `scheduled` event handler in Worker
- No HTTP endpoint needed (internal trigger)
- Can call external APIs or database

---

## 5. Architecture Decision

### Recommended Approach: Hono + Cloudflare Workers (Native)

**Rationale:**
1. **Full control** — No Next.js abstraction layer
2. **Workers-native** — Direct D1/R2/KV access
3. **Proven compatibility** — Hono designed for Workers
4. **Simpler build** — No OpenNext complexity
5. **Performance** — Minimal runtime overhead
6. **Database flexibility** — Can use D1 or HTTP Postgres

**Trade-offs:**
- No Next.js SSR/SSG benefits
- Manual routing setup
- Need to build frontend separately (React SPA or server-rendered HTML)

### Alternative: Next.js + OpenNext (If SSR Required)

**Use if:**
- Server-side rendering critical
- Need App Router features
- Want Next.js DX

**Requires:**
- OpenNext adapter configuration
- Neon HTTP or similar for database
- Replace `pg` with HTTP client
- Test extensively (community adapter)

---

## 6. Database Strategy

### Recommended: Neon Postgres (HTTP API)

**Why:**
- PostgreSQL compatibility (preserve schema)
- HTTP access (Workers-compatible)
- Managed service
- No connection pooling complexity
- Full SQL feature set

**Alternative: D1 (SQLite)**
- Native Cloudflare
- Schema migration required (PostgreSQL → SQLite)
- Limited full-text search
- Good for simpler queries

**Schema Preservation:**
- Keep `jobs` table structure
- UNIQUE(source, source_job_id) for deduplication
- All indexes (source, category, location, etc.)
- Full-text search if Postgres (not D1)

---

## 7. Scraper Strategy

### Execution Context: Cloudflare Cron Trigger

**Pattern:**
```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScraper(env));
  }
}

async function runScraper(env: Env) {
  // Fetch from RemoteOK, Remotive, Jobicy
  // Normalize → Validate → Deduplicate
  // Upsert via HTTP Postgres or D1
}
```

**Dependencies:**
- Replace `pg` with Neon HTTP client or D1 binding
- Remove `dotenv`, use `env.DATABASE_URL`
- Keep fetch (native)

**Modular Structure (preserve):**
```
src/
├── scraper/
│   ├── sources/
│   │   ├── remoteok.ts
│   │   ├── remotive.ts
│   │   └── jobicy.ts
│   ├── normalize.ts
│   ├── validate.ts
│   ├── deduplicate.ts
│   └── index.ts
└── index.ts  # Worker entry + cron handler
```

---

## 8. Node.js Compatibility Findings

### Incompatible with Workers

**`pg` module:**
- Requires Node.js TCP sockets
- Must replace with HTTP client (Neon, Vercel Postgres)

**`dotenv`:**
- Not needed (Workers use `env` binding)

**`fs`, `path`, `process` (if used):**
- No filesystem in Workers
- Replace with KV, R2, or remove

### Workers-Compatible

**`fetch`:**
- Native Web API

**TypeScript:**
- Compile to JavaScript, works fine

**JSON processing:**
- Standard JavaScript

---

## 9. Risks

### Technical Risks

1. **Database HTTP Performance**
   - Neon HTTP may have higher latency than direct TCP
   - Mitigation: Use connection pooling, batch queries

2. **Workers Execution Limits**
   - CPU time: 50ms (free), 30s (paid)
   - Scraper may need batching for large datasets
   - Mitigation: Process sources sequentially, use `ctx.waitUntil()`

3. **OpenNext Maturity (if Next.js chosen)**
   - Community adapter, not official
   - May have edge cases
   - Mitigation: Test thoroughly, have fallback plan

4. **D1 Limitations (if SQLite chosen)**
   - No full-text search (tsvector)
   - Must implement search differently
   - Mitigation: Use external search or simple LIKE queries

### Deployment Risks

1. **Environment Variables**
   - Workers use `wrangler secret` or `[vars]` in wrangler.toml
   - Must migrate from Vercel env vars
   - Mitigation: Document clearly, use wrangler CLI

2. **Cron Reliability**
   - Cloudflare Cron runs on schedule (not guaranteed instant)
   - Mitigation: Add monitoring, manual trigger endpoint

---

## 10. Phased Implementation Plan

### Phase 1: Foundation ✅
**Status:** COMPLETE (this document)
- Audit JOBFORGE architecture
- Audit Cloudflare Workers compatibility
- Decide architecture (Hono + Workers)
- Decide database (Neon Postgres HTTP)
- Document risks and plan

### Phase 2: Project Setup
**Deliverable:** Minimal Worker that responds to HTTP
**Tasks:**
- Initialize `wrangler.toml`
- Create `src/index.ts` with basic Hono app
- Add TypeScript config
- Configure Neon Postgres
- Test: `wrangler dev` works

**Verification:**
- `wrangler dev` serves HTTP 200
- `wrangler deploy --dry-run` passes

### Phase 3: Database Layer
**Deliverable:** Database module with schema init + CRUD
**Tasks:**
- Install Neon HTTP client
- Create `src/db/schema.ts` (SQL migrations)
- Create `src/db/repository.ts` (JobRepository)
- Implement: `initSchema()`, `upsertJobs()`, `getJobs()`, `getJobById()`
- Test: local against Neon dev database

**Verification:**
- Schema init creates table
- Upsert works (INSERT/UPDATE)
- Query returns jobs

### Phase 4: Scraper Pipeline
**Deliverable:** Scraper modules (fetch, normalize, validate, deduplicate)
**Tasks:**
- Port `sources.ts` (RemoteOK, Remotive, Jobicy)
- Port `normalize.ts` (raw → normalized)
- Port `validate.ts` (validation rules)
- Port `deduplicate.ts` (dedup by source+sourceJobId)
- Create `src/scraper/index.ts` (pipeline orchestration)
- Test: manual scraper execution (not cron yet)

**Verification:**
- Fetch returns jobs from each source
- Normalize produces valid structure
- Validate filters invalid jobs
- Deduplicate removes dupes
- Pipeline returns metrics

### Phase 5: Cron Handler
**Deliverable:** Scheduled handler that runs scraper daily
**Tasks:**
- Add `scheduled` handler to `src/index.ts`
- Configure `wrangler.toml` cron trigger (daily)
- Call scraper pipeline from `scheduled()`
- Add logging/metrics
- Test: `wrangler dev --test-scheduled`

**Verification:**
- `wrangler dev --test-scheduled` triggers scraper
- Scraper runs, upserts jobs
- Logs show metrics

### Phase 6: API Routes
**Deliverable:** HTTP API for job listing and detail
**Tasks:**
- Add Hono route: `GET /api/jobs` (list with filters)
- Add Hono route: `GET /api/jobs/:id` (detail)
- Add query parameters: `keyword`, `location`, `category`, `limit`, `offset`
- Return JSON responses
- Test: manual HTTP requests

**Verification:**
- `GET /api/jobs` returns job list
- `GET /api/jobs/:id` returns single job
- Filters work (keyword, location, category)
- Pagination works (limit, offset)

### Phase 7: Frontend
**Deliverable:** HTML pages for listing and detail
**Tasks:**
- Create `src/views/` (HTML templates or React build)
- Add Hono route: `GET /` (homepage listing)
- Add Hono route: `GET /jobs/:id` (job detail)
- Add search form
- Add filter UI
- Style with Bootstrap (or Tailwind)
- Test: browser navigation

**Verification:**
- Homepage shows jobs
- Job detail page renders
- Search works
- Filters work
- Mobile responsive

### Phase 8: SEO
**Deliverable:** SEO metadata, sitemaps, structured data
**Tasks:**
- Add meta tags (title, description, OG)
- Add JSON-LD JobPosting structured data
- Add `GET /sitemap.xml` (dynamic sitemap)
- Add `GET /robots.txt`
- Test: validate with Google Rich Results Test

**Verification:**
- Meta tags present
- JSON-LD valid
- Sitemap generated
- robots.txt accessible

### Phase 9: Cloudflare Deployment
**Deliverable:** Live production site on Cloudflare Workers
**Tasks:**
- Configure production `wrangler.toml`
- Set production secrets (`wrangler secret put DATABASE_URL`)
- Deploy: `wrangler deploy`
- Verify: production URL works
- Verify: cron runs (check logs)
- Test: full user flow (search, view, detail)

**Verification:**
- Site accessible via Workers URL
- Jobs display correctly
- Search/filters work
- Job detail works
- Cron runs daily (check logs after 24h)

### Phase 10: Custom Domain (Optional)
**Deliverable:** Custom domain pointing to Workers
**Tasks:**
- Configure Cloudflare DNS
- Add Workers route for domain
- Update SEO config (base URL)
- Test: custom domain works

**Verification:**
- Custom domain resolves
- All routes work on custom domain
- SEO uses custom domain URLs

---

## 11. Technology Stack (Final)

### Runtime
- **Cloudflare Workers** (V8 isolates)

### Framework
- **Hono** (lightweight, Workers-native)

### Database
- **Neon Postgres** (HTTP API)
- PostgreSQL 16+

### Frontend
- **Server-rendered HTML** (via Hono) or **React SPA**
- **Bootstrap 5** (CSS framework)

### Scraper
- **TypeScript**
- **Neon HTTP Client** (replace `pg`)
- **Native fetch** (Web API)

### Build Tools
- **TypeScript 5.5+**
- **Wrangler** (Cloudflare CLI)
- **esbuild** (via Wrangler)

### Cron
- **Cloudflare Cron Triggers** (configured in `wrangler.toml`)

---

## 12. Key Differences from JOBFORGE

| Aspect | JOBFORGE (Vercel) | JOBWORKERS (Cloudflare) |
|--------|-------------------|-------------------------|
| **Runtime** | Node.js 20 (Vercel Functions) | V8 isolates (Workers) |
| **Framework** | Next.js 14 (App Router) | Hono (minimal) |
| **Database Access** | `pg` (TCP) | Neon HTTP API |
| **Cron** | Vercel Cron (HTTP endpoint) | Cloudflare Cron Triggers (`scheduled`) |
| **Frontend** | Next.js SSR/SSG | Server-rendered HTML or SPA |
| **Build** | Next.js build | Wrangler (esbuild) |
| **Deployment** | `vercel deploy` | `wrangler deploy` |
| **Environment** | Vercel env vars | `wrangler secret` + `[vars]` |

---

## 13. What NOT to Do

### DON'T Copy JOBFORGE Blindly
- JOBFORGE uses Vercel-specific patterns
- Workers runtime is different
- Must adapt, not copy-paste

### DON'T Use Node.js-Only Dependencies
- `pg` module won't work
- `fs`, `path`, `process` unavailable
- Must use Workers-compatible alternatives

### DON'T Assume Next.js Works Out-of-Box
- OpenNext is complex and community-maintained
- Native Workers approach is simpler for this use case

### DON'T Ignore Workers Execution Limits
- 50ms CPU time (free tier)
- 30s (paid tier)
- Scraper must be efficient

### DON'T Hardcode Configuration
- Use environment variables (`env` binding)
- No secrets in code

### DON'T Skip Testing
- Test scraper locally before deployment
- Test cron triggers with `wrangler dev --test-scheduled`
- Test production after deployment

---

## 14. Next Steps

**STOP HERE for Phase 1.**

**Phase 1 deliverable:** This document (PHASE1_ARCHITECTURE_AUDIT.md)

**Awaiting user approval to proceed to Phase 2.**

**Phase 2 will begin:** Project setup (wrangler.toml, basic Worker, TypeScript config)

---

## 15. Questions for User (If Any)

1. **Database preference:** Neon Postgres (recommended) or D1 (SQLite)?
2. **Frontend approach:** Server-rendered HTML (simpler) or React SPA (richer UX)?
3. **Custom domain:** Do you have a domain ready, or use Workers subdomain initially?
4. **Budget:** Free tier (50ms CPU limit) or paid Workers plan (30s limit)?

---

**END OF PHASE 1 AUDIT**
