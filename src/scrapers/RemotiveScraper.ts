// JOBWORKERS Remotive Scraper
// https://remotive.com/api/remote-jobs

import { IJobScraper, RawJob, NormalizedJob } from './types';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary?: string;
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

export class RemotiveScraper implements IJobScraper {
  readonly name = 'remotive';
  readonly endpoint = 'https://remotive.com/api/remote-jobs';
  
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

      const data: RemotiveResponse = await response.json();
      
      if (!data.jobs || !Array.isArray(data.jobs)) {
        throw new Error('Invalid response format: expected jobs array');
      }

      return data.jobs;
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
      const job = raw as RemotiveJob;

      if (!job.id || !job.title || !job.company_name || !job.url) {
        return null; // Missing required fields
      }

      // Parse posted date
      let postedAt: Date | undefined;
      if (job.publication_date) {
        const parsed = new Date(job.publication_date);
        if (!isNaN(parsed.getTime())) {
          postedAt = parsed;
        }
      }

      // Map job_type to employment_type
      const employmentType = job.job_type 
        ? job.job_type.toLowerCase().replace(/\s+/g, '-')
        : 'full-time';

      return {
        source: this.name,
        source_job_id: job.id.toString(),
        title: job.title.trim(),
        company: job.company_name.trim(),
        location: job.candidate_required_location || 'Remote',
        description: job.description || '',
        url: job.url,
        category: job.category || 'other',
        employment_type: employmentType,
        posted_at: postedAt,
      };
    } catch (error) {
      console.error('Remotive normalization error:', error);
      return null;
    }
  }
}
