// JOBWORKERS RemoteOK Scraper
// https://remoteok.com/api

import { IJobScraper, RawJob, NormalizedJob } from './types';

interface RemoteOKJob {
  id: string;
  slug?: string;
  position: string;
  company: string;
  company_logo?: string;
  location?: string;
  description?: string;
  url: string;
  tags?: string[];
  date?: string;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
}

export class RemoteOKScraper implements IJobScraper {
  readonly name = 'remoteok';
  readonly endpoint = 'https://remoteok.com/api';
  
  private readonly timeout = 30000; // 30s
  private readonly userAgent = 'JOBWORKERS/1.0 (Job Aggregator)';

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
      
      // RemoteOK API returns array where first item is metadata
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array');
      }

      // Filter out metadata (first item typically has "legal" field)
      const jobs = data.filter((item) => item.id && item.position);
      
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

  normalizeJob(raw: RawJob): NormalizedJob | null {
    try {
      const job = raw as RemoteOKJob;

      if (!job.id || !job.position || !job.company || !job.url) {
        return null; // Missing required fields
      }

      // Extract category from tags (first tag as category)
      const category = job.tags && job.tags.length > 0 
        ? job.tags[0].toLowerCase() 
        : 'other';

      // Parse posted date
      let postedAt: Date | undefined;
      if (job.date) {
        const timestamp = parseInt(job.date, 10);
        if (!isNaN(timestamp)) {
          postedAt = new Date(timestamp * 1000);
        }
      }

      return {
        source: this.name,
        source_job_id: job.id.toString(),
        title: job.position.trim(),
        company: job.company.trim(),
        location: job.location || 'Remote',
        description: job.description || '',
        url: job.url,
        category: category,
        employment_type: 'full-time', // RemoteOK doesn't specify
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        posted_at: postedAt,
      };
    } catch (error) {
      console.error('RemoteOK normalization error:', error);
      return null;
    }
  }
}
