// JOBWORKERS Ashby Scraper
// Scrapes jobs from Ashby-hosted job boards

import { IJobScraper, RawJob, NormalizedJob } from './types';

interface AshbyJob {
  id: string;
  title: string;
  description?: string;
  descriptionPlain?: string;
  department?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  locations?: Array<{
    city?: string;
    state?: string;
    country?: string;
  }>;
  jobType?: string;
  employmentType?: string;
  remote?: boolean;
  salary?: {
    currency?: string;
    min?: number;
    max?: number;
  };
  url: string;
  publishedAt?: string;
  companyName?: string;
}

interface AshbyResponse {
  results: AshbyJob[];
}

export class AshbyScraper implements IJobScraper {
  readonly name = 'ashby';
  readonly endpoint: string;
  
  private readonly timeout = 30000; // 30s
  private readonly userAgent = 'JOBWORKERS/1.0 (Job Aggregator)';
  private readonly company: string;

  constructor(boardUrl: string, companyName?: string) {
    // Extract company slug from Ashby board URL
    // Format: https://jobs.ashbyhq.com/company-slug or similar
    const urlObj = new URL(boardUrl);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    this.company = companyName || pathParts[pathParts.length - 1] || 'ashby-company';
    
    // Ashby API endpoint for job board
    // Standard format: https://jobs.ashbyhq.com/company-slug/api/non-public/jobs
    this.endpoint = `${boardUrl.replace(/\/$/, '')}/api/non-public/jobs`;
  }

  async fetchJobs(): Promise<RawJob[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.endpoint, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AshbyResponse = await response.json();
      
      if (!Array.isArray(data.results)) {
        throw new Error('Invalid response format: expected results array');
      }

      return data.results;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during fetch');
    }
  }

  normalizeJob(raw: RawJob): NormalizedJob | null {
    try {
      const job = raw as AshbyJob;

      if (!job.id || !job.title || !job.url) {
        return null; // Missing required fields
      }

      // Format location
      const location = this.formatLocation(job);

      // Determine if remote
      const isRemote = job.remote === true;

      // Use descriptionPlain if available, otherwise description
      const description = job.descriptionPlain || job.description || '';

      // Parse employment type
      const employmentType = (job.employmentType || job.jobType || 'full-time')
        .toLowerCase()
        .replace(/\s+/g, '-');

      // Parse category from department
      const category = (job.department || 'other').toLowerCase().replace(/\s+/g, '-');

      // Parse posted date
      let postedAt: Date | undefined;
      if (job.publishedAt) {
        const parsed = new Date(job.publishedAt);
        if (!isNaN(parsed.getTime())) {
          postedAt = parsed;
        }
      }

      // Extract salary if available
      let salaryMin: number | undefined;
      let salaryMax: number | undefined;
      if (job.salary) {
        salaryMin = job.salary.min;
        salaryMax = job.salary.max;
      }

      return {
        source: this.name,
        source_job_id: job.id,
        title: job.title.trim(),
        company: this.company,
        location: isRemote ? 'Remote' : location,
        description: description.trim(),
        url: job.url,
        category: category,
        employment_type: employmentType,
        salary_min: salaryMin,
        salary_max: salaryMax,
        posted_at: postedAt,
      };
    } catch (error) {
      console.error('[ashby] Error normalizing job:', error);
      return null;
    }
  }

  private formatLocation(job: AshbyJob): string {
    // Use single location if available
    if (job.location) {
      return this.locationToString(job.location);
    }

    // Use first location from locations array
    if (job.locations && job.locations.length > 0) {
      return this.locationToString(job.locations[0]);
    }

    return 'Remote';
  }

  private locationToString(loc: { city?: string; state?: string; country?: string }): string {
    const parts: string[] = [];
    
    if (loc.city) parts.push(loc.city);
    if (loc.state) parts.push(loc.state);
    if (loc.country) parts.push(loc.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Remote';
  }
}
