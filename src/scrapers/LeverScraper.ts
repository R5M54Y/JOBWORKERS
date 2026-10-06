// JOBWORKERS Lever Scraper
// Scrapes jobs from Lever-hosted job boards via public API
// https://api.lever.co/v0/postings/{company}

import { IJobScraper, RawJob, NormalizedJob } from './types';

interface LeverLocation {
  name: string;
}

interface LeverCategory {
  team?: string;
  department?: string;
  location?: string;
  commitment?: string;
  level?: string;
}

interface LeverJob {
  id: string;
  text: string; // job title
  hostedUrl: string;
  applyUrl: string;
  createdAt: number; // timestamp
  categories: LeverCategory;
  description: string;
  descriptionPlain?: string;
  lists?: Array<{
    text: string;
    content: string;
  }>;
  additional?: string;
  additionalPlain?: string;
}

export class LeverScraper implements IJobScraper {
  readonly name = 'ashby'; // Keep source as 'ashby' for consistency with config
  readonly endpoint: string;
  
  private readonly timeout = 30000; // 30s
  private readonly userAgent = 'JOBWORKERS/1.0 (Job Aggregator)';
  private readonly company: string;

  constructor(boardUrl: string, companyName?: string) {
    // Extract company slug from Lever board URL
    // Format: https://jobs.lever.co/company-slug
    const urlObj = new URL(boardUrl);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    const companySlug = pathParts[pathParts.length - 1] || 'company';
    this.company = companyName || companySlug;
    
    // Lever public API endpoint
    this.endpoint = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
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

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array');
      }

      return data;
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
      const job = raw as LeverJob;

      if (!job.id || !job.text || !job.hostedUrl) {
        return null; // Missing required fields
      }

      // Format location
      const location = job.categories?.location || 'Remote';

      // Determine if remote
      const isRemote = location.toLowerCase().includes('remote');

      // Extract description (prefer plain text)
      const description = job.descriptionPlain || this.stripHtml(job.description);

      // Parse employment type from commitment
      const employmentType = job.categories?.commitment
        ? job.categories.commitment.toLowerCase().replace(/\s+/g, '-')
        : 'full-time';

      // Parse category from team or department
      const category = (job.categories?.team || job.categories?.department || 'other')
        .toLowerCase()
        .replace(/\s+/g, '-');

      // Parse posted date
      let postedAt: Date | undefined;
      if (job.createdAt) {
        postedAt = new Date(job.createdAt);
        if (isNaN(postedAt.getTime())) {
          postedAt = undefined;
        }
      }

      return {
        source: this.name,
        source_job_id: job.id,
        title: job.text.trim(),
        company: this.company,
        location: isRemote ? 'Remote' : location,
        description: description.trim().substring(0, 5000), // Limit description length
        url: job.hostedUrl,
        category: category,
        employment_type: employmentType,
        posted_at: postedAt,
      };
    } catch (error) {
      console.error('[lever/ashby] Error normalizing job:', error);
      return null;
    }
  }

  private stripHtml(html: string): string {
    // Basic HTML tag removal
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
