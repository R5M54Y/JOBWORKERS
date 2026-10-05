// JOBWORKERS Job Types

export type JobStatus = 'active' | 'inactive' | 'expired';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'freelance';

export interface Job {
  id: number;
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
  status: JobStatus;
  posted_at: Date;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJobInput {
  source: string;
  source_job_id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  url: string;
  category?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  status?: JobStatus;
  posted_at?: Date;
  expires_at?: Date;
}

export interface UpdateJobInput {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  category?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  status?: JobStatus;
  expires_at?: Date;
}

export interface ListJobsFilters {
  source?: string;
  category?: string;
  employment_type?: string;
  location?: string;
  status?: JobStatus;
  limit?: number;
  offset?: number;
}
