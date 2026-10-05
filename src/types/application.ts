// JOBWORKERS Application Status Type
export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

// Map frontend statuses to database statuses
export const STATUS_MAP: Record<ApplicationStatus, string> = {
  applied: 'pending',
  interview: 'reviewed',
  offer: 'accepted',
  rejected: 'rejected',
};

// Reverse map
export const REVERSE_STATUS_MAP: Record<string, ApplicationStatus> = {
  pending: 'applied',
  reviewed: 'interview',
  accepted: 'offer',
  rejected: 'rejected',
};

export interface JobApplication {
  id: number;
  user_id: number;
  job_id: number;
  status: string;
  notes?: string;
  external_id?: string;
  applied_via: string;
  status_history?: string;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationWithJob extends JobApplication {
  job?: {
    id: number;
    title: string;
    company: string;
    location: string;
    source: string;
    url: string;
  };
}
