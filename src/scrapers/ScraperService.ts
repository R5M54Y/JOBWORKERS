// JOBWORKERS Scraper Service
// Orchestrates multiple job scrapers with provider isolation

import { IJobScraper, ScraperResult, PipelineResult, NormalizedJob } from './types';
import { RemoteOKScraper } from './RemoteOKScraper';
import { RemotiveScraper } from './RemotiveScraper';
import { JobicyScraper } from './JobicyScraper';
import { LeverScraper } from './LeverScraper';
import { JobRepository } from '../repositories/JobRepository';
import { CreateJobInput } from '../types/job';

// Lever/Ashby board configurations
const LEVER_BOARDS = [
  {
    url: 'https://jobs.lever.co/toptal',
    company: 'Toptal',
  },
];

export class ScraperService {
  private scrapers: IJobScraper[];
  private repository: JobRepository;

  constructor(db: D1Database) {
    this.scrapers = [
      new RemoteOKScraper(),
      new RemotiveScraper(),
      new JobicyScraper(),
      // Register Lever boards (source='ashby' for config consistency)
      ...LEVER_BOARDS.map(board => new LeverScraper(board.url, board.company)),
    ];
    this.repository = new JobRepository(db);
  }

  async runAll(): Promise<PipelineResult> {
    const startTime = Date.now();
    const started_at = new Date().toISOString();
    const results: ScraperResult[] = [];

    // Run each scraper independently
    for (const scraper of this.scrapers) {
      const result = await this.runScraper(scraper);
      results.push(result);
    }

    const completed_at = new Date().toISOString();
    const total_duration_ms = Date.now() - startTime;

    // Calculate summary
    const summary = {
      total_fetched: results.reduce((sum, r) => sum + r.fetched, 0),
      total_inserted: results.reduce((sum, r) => sum + r.inserted, 0),
      total_updated: results.reduce((sum, r) => sum + r.updated, 0),
      total_skipped: results.reduce((sum, r) => sum + r.skipped, 0),
      total_failed: results.reduce((sum, r) => sum + r.failed, 0),
    };

    return {
      started_at,
      completed_at,
      total_duration_ms,
      providers: results,
      summary,
    };
  }

  private async runScraper(scraper: IJobScraper): Promise<ScraperResult> {
    const startTime = Date.now();
    const result: ScraperResult = {
      provider: scraper.name,
      fetched: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      duration_ms: 0,
      errors: [],
    };

    try {
      console.log(`[${scraper.name}] Fetching jobs...`);
      
      // Fetch raw jobs
      const rawJobs = await scraper.fetchJobs();
      result.fetched = rawJobs.length;
      console.log(`[${scraper.name}] Fetched ${result.fetched} jobs`);

      // Normalize and persist each job
      for (const raw of rawJobs) {
        try {
          const normalized = scraper.normalizeJob(raw);
          
          if (!normalized) {
            result.skipped++;
            continue;
          }

          // Convert to CreateJobInput
          const input: CreateJobInput = {
            source: normalized.source,
            source_job_id: normalized.source_job_id,
            title: normalized.title,
            company: normalized.company,
            location: normalized.location,
            description: normalized.description,
            url: normalized.url,
            category: normalized.category,
            employment_type: normalized.employment_type,
            salary_min: normalized.salary_min,
            salary_max: normalized.salary_max,
            status: 'active',
            posted_at: normalized.posted_at,
            expires_at: normalized.expires_at,
          };

          // Upsert (INSERT or UPDATE based on source + source_job_id)
          const job = await this.repository.upsertJob(input);
          
          // Check if it was an insert or update (heuristic: created_at ~= updated_at)
          const isNew = Math.abs(
            new Date(job.created_at).getTime() - new Date(job.updated_at).getTime()
          ) < 1000;
          
          if (isNew) {
            result.inserted++;
          } else {
            result.updated++;
          }
        } catch (error) {
          result.failed++;
          const err = error as Error;
          result.errors.push(`Job normalization/persistence failed: ${err.message}`);
        }
      }

      console.log(`[${scraper.name}] Inserted: ${result.inserted}, Updated: ${result.updated}, Skipped: ${result.skipped}, Failed: ${result.failed}`);
    } catch (error) {
      const err = error as Error;
      result.errors.push(`Provider fetch failed: ${err.message}`);
      console.error(`[${scraper.name}] FATAL:`, err);
    }

    result.duration_ms = Date.now() - startTime;
    return result;
  }
}
