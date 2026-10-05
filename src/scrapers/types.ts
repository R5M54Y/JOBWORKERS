// JOBWORKERS Scraper Types
// Common interfaces for job scrapers

export interface RawJob {
  // Minimal raw representation from any provider
  [key: string]: any;
}

export interface ScraperResult {
  provider: string;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  duration_ms: number;
  errors: string[];
}

export interface PipelineResult {
  started_at: string;
  completed_at: string;
  total_duration_ms: number;
  providers: ScraperResult[];
  summary: {
    total_fetched: number;
    total_inserted: number;
    total_updated: number;
    total_skipped: number;
    total_failed: number;
  };
}

// Common scraper interface
export interface IJobScraper {
  readonly name: string;
  readonly endpoint: string;
  
  fetchJobs(): Promise<RawJob[]>;
  normalizeJob(raw: RawJob): NormalizedJob | null;
}

// Normalized job representation (pre-persistence)
export interface NormalizedJob {
  source: string;
  source_job_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  category: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  posted_at?: Date;
  expires_at?: Date;
}
