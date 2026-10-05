// JOBWORKERS Jobicy Scraper
// https://jobicy.com/api/v2/remote-jobs

import { IJobScraper, RawJob, NormalizedJob } from './types';

interface JobicyJob {
  id: string;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
  annualSalaryMin?: string;
  annualSalaryMax?: string;
  salaryCurrency?: string;
}

interface JobicyResponse {
  jobs: JobicyJob[];
  count: number;
}

export class JobicyScraper implements IJobScraper {
  readonly name = 'jobicy';
  readonly endpoint = 'https://jobicy.com/api/v2/remote-jobs';
  
  private readonly timeout = 30000; // 30s
  private readonly userAgent = 'JOBWORKERS/1.0 (Job Aggregator)';

  async fetchJobs(): Promise<RawJob[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Jobicy API requires count parameter
      const url = `${this.endpoint}?count=100`;

      const response = await fetch(url, {
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

      const data: JobicyResponse = await response.json();
      
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
      const job = raw as JobicyJob;

      if (!job.id || !job.jobTitle || !job.companyName || !job.url) {
        return null; // Missing required fields
      }

      // Extract category (first industry)
      const category = job.jobIndustry && job.jobIndustry.length > 0
        ? job.jobIndustry[0].toLowerCase()
        : 'other';

      // Extract employment type (first type)
      const employmentType = job.jobType && job.jobType.length > 0
        ? job.jobType[0].toLowerCase().replace(/\s+/g, '-')
        : 'full-time';

      // Parse posted date
      let postedAt: Date | undefined;
      if (job.pubDate) {
        const parsed = new Date(job.pubDate);
        if (!isNaN(parsed.getTime())) {
          postedAt = parsed;
        }
      }

      // Parse salary
      let salaryMin: number | undefined;
      let salaryMax: number | undefined;
      
      if (job.annualSalaryMin) {
        const min = parseInt(job.annualSalaryMin.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(min)) salaryMin = min;
      }
      
      if (job.annualSalaryMax) {
        const max = parseInt(job.annualSalaryMax.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(max)) salaryMax = max;
      }

      return {
        source: this.name,
        source_job_id: job.id.toString(),
        title: job.jobTitle.trim(),
        company: job.companyName.trim(),
        location: job.jobGeo || 'Remote',
        description: job.jobDescription || job.jobExcerpt || '',
        url: job.url,
        category: category,
        employment_type: employmentType,
        salary_min: salaryMin,
        salary_max: salaryMax,
        posted_at: postedAt,
      };
    } catch (error) {
      console.error('Jobicy normalization error:', error);
      return null;
    }
  }
}
