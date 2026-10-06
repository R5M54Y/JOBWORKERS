// JOBWORKERS Ashby Scraper
// Scrapes jobs from Ashby-hosted job boards via their public API

import { IJobScraper, RawJob, NormalizedJob } from './types';

interface AshbyJobLocation {
  name?: string;
  address?: string;
  addressComponents?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface AshbyJob {
  id: string;
  title: string;
  teamId?: string;
  locationId?: string;
  locationName?: string;
  workplaceType?: string; // "Remote", "Onsite", "Hybrid"
  employmentType?: string; // "FullTime", "PartTime", "Contract"
  secondaryLocations?: Array<{
    locationId: string;
    locationName: string;
  }>;
  compensationTierSummary?: string;
}

interface AshbyApiResponse {
  jobs: AshbyJob[];
}

export class AshbyScraper implements IJobScraper {
  readonly name = 'ashby';
  readonly endpoint: string;
  
  private readonly timeout = 30000; // 30s
  private readonly userAgent = 'JOBWORKERS/1.0 (Job Aggregator)';
  private readonly company: string;
  private readonly companySlug: string;

  constructor(boardUrl: string, companyName?: string) {
    // Extract company slug from Ashby board URL
    // Format: https://jobs.ashbyhq.com/company-slug
    const urlObj = new URL(boardUrl);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    this.companySlug = pathParts[0] || 'company';
    this.company = companyName || this.companySlug;
    
    // Ashby public API endpoint
    // Standard format: https://api.ashbyhq.com/posting-api/job-board/{organizationId}
    // For direct board access, we use the embedded data approach
    this.endpoint = boardUrl.replace(/\/$/, '');
  }

  async fetchJobs(): Promise<RawJob[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Fetch the board HTML page which contains embedded job data
      const response = await fetch(this.endpoint, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Extract job data from window.__appData or script tags
      // Ashby embeds job data in the initial HTML for SSR
      const jobs = this.extractJobsFromHtml(html);

      return jobs;
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

  private extractJobsFromHtml(html: string): RawJob[] {
    // Ashby embeds job data in window.__appData
    // Look for: window.__appData = {...};
    const appDataMatch = html.match(/window\.__appData\s*=\s*(\{.+?\});/s);
    
    if (!appDataMatch) {
      console.error('[ashby] No window.__appData found in HTML');
      return [];
    }

    try {
      const appData = JSON.parse(appDataMatch[1]);
      
      // Ashby structure: appData.jobBoard.jobPostings[]
      if (appData.jobBoard?.jobPostings && Array.isArray(appData.jobBoard.jobPostings)) {
        return appData.jobBoard.jobPostings;
      }
      
      // Fallback: check other possible locations
      if (appData.jobs && Array.isArray(appData.jobs)) {
        return appData.jobs;
      }

      console.warn('[ashby] No jobPostings array found in window.__appData');
      return [];
    } catch (error) {
      console.error('[ashby] Failed to parse embedded job data:', error);
      return [];
    }
  }

  normalizeJob(raw: RawJob): NormalizedJob | null {
    try {
      const job = raw as AshbyJob;

      if (!job.id || !job.title) {
        return null; // Missing required fields
      }

      // Build job URL: https://jobs.ashbyhq.com/{slug}/{jobId}
      const jobUrl = `${this.endpoint}/${job.id}`;

      // Format location
      const location = this.formatLocation(job);

      // Parse employment type: "FullTime" -> "full-time"
      let employmentType = 'full-time';
      if (job.employmentType) {
        employmentType = job.employmentType
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()
          .replace(/^-/, '');
      }

      // Category placeholder (Ashby jobPostings minimal data)
      const category = 'engineering';

      // No posted_at in jobPostings array, use current date as fallback
      const postedAt = new Date();

      return {
        source: this.name,
        source_job_id: job.id,
        title: job.title.trim(),
        company: this.company,
        location: location,
        description: job.compensationTierSummary || job.title, // Minimal description
        url: jobUrl,
        category: category,
        employment_type: employmentType,
        posted_at: postedAt,
      };
    } catch (error) {
      console.error('[ashby] Error normalizing job:', error);
      return null;
    }
  }

  private formatLocation(job: AshbyJob): string {
    // Use locationName if available
    if (job.locationName) {
      return job.locationName;
    }

    // Use workplaceType as fallback
    if (job.workplaceType === 'Remote') {
      return 'Remote';
    }

    // Use first secondary location
    if (job.secondaryLocations && job.secondaryLocations.length > 0) {
      return job.secondaryLocations[0].locationName;
    }

    return 'Remote';
  }
}
