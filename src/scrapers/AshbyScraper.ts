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
  teamName?: string;
  departmentName?: string;
  locationName?: string;
  location?: AshbyJobLocation;
  secondaryLocations?: AshbyJobLocation[];
  employmentType?: string;
  isRemote?: boolean;
  description?: string;
  descriptionHtml?: string;
  publishedDate?: string;
  updatedAt?: string;
  jobUrl?: string;
  applyUrl?: string;
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
    // Look for: window.__appData = {...}
    const appDataMatch = html.match(/window\.__appData\s*=\s*({.*?});/s);
    
    if (!appDataMatch) {
      // No jobs found or different structure
      return [];
    }

    try {
      const appData = JSON.parse(appDataMatch[1]);
      
      // Jobs might be in various locations depending on Ashby version
      if (appData.jobs && Array.isArray(appData.jobs)) {
        return appData.jobs;
      }
      
      if (appData.jobBoard && appData.jobBoard.jobs) {
        return appData.jobBoard.jobs;
      }

      // If no jobs array found, return empty
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

      // Build job URL
      const jobUrl = job.jobUrl || job.applyUrl || `${this.endpoint}/${job.id}`;

      // Format location
      const location = this.formatLocation(job);

      // Determine if remote
      const isRemote = job.isRemote === true || location.toLowerCase().includes('remote');

      // Extract description (prefer plain text, fallback to HTML stripped)
      const description = job.description || this.stripHtml(job.descriptionHtml || '');

      // Parse employment type
      const employmentType = (job.employmentType || 'full-time')
        .toLowerCase()
        .replace(/\s+/g, '-');

      // Parse category from department or team
      const category = (job.departmentName || job.teamName || 'other')
        .toLowerCase()
        .replace(/\s+/g, '-');

      // Parse posted date
      let postedAt: Date | undefined;
      if (job.publishedDate) {
        const parsed = new Date(job.publishedDate);
        if (!isNaN(parsed.getTime())) {
          postedAt = parsed;
        }
      } else if (job.updatedAt) {
        const parsed = new Date(job.updatedAt);
        if (!isNaN(parsed.getTime())) {
          postedAt = parsed;
        }
      }

      return {
        source: this.name,
        source_job_id: job.id,
        title: job.title.trim(),
        company: this.company,
        location: isRemote ? 'Remote' : location,
        description: description.trim().substring(0, 5000), // Limit description length
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

    // Use location object
    if (job.location) {
      if (job.location.name) return job.location.name;
      
      if (job.location.addressComponents) {
        const parts: string[] = [];
        const addr = job.location.addressComponents;
        
        if (addr.city) parts.push(addr.city);
        if (addr.state) parts.push(addr.state);
        if (addr.country) parts.push(addr.country);
        
        if (parts.length > 0) return parts.join(', ');
      }
      
      if (job.location.address) return job.location.address;
    }

    // Use first secondary location
    if (job.secondaryLocations && job.secondaryLocations.length > 0) {
      const loc = job.secondaryLocations[0];
      if (loc.name) return loc.name;
    }

    return 'Remote';
  }

  private stripHtml(html: string): string {
    // Basic HTML tag removal
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
