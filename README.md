# JOBWORKERS

Remote job aggregator rebuilt for **Cloudflare Workers** from the ground up.

## Mission

Clean rebuild of JOBFORGE optimized for Cloudflare Workers runtime.

**NOT a copy-paste** — a deliberate reimplementation using JOBFORGE as functional reference.

## Status

**Phase 1 COMPLETE:** Architecture audit, Cloudflare compatibility analysis, technology decisions.

See `.docs/PHASE1_ARCHITECTURE_AUDIT.md` for complete analysis.

## Technology Stack (Decided)

- **Runtime:** Cloudflare Workers (V8 isolates)
- **Framework:** Hono (Workers-native)
- **Database:** Neon Postgres (HTTP API)
- **Scraper:** TypeScript + Neon HTTP Client
- **Cron:** Cloudflare Cron Triggers
- **Build:** Wrangler + esbuild

## Repository

https://github.com/R5M54Y/JOBWORKERS

## Next Phase

Phase 2: Project setup (wrangler.toml, basic Worker, TypeScript config)

**Awaiting user approval to proceed.**
