// JOBWORKERS Saved Search Types

export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  search?: string;
  source?: string;
  location?: string;
  employment_type?: string;
  category?: string;
  remote: number; // 0 or 1 (SQLite boolean)
  is_active: number; // 0 or 1 (SQLite boolean)
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedSearchInput {
  user_id: number;
  name: string;
  search?: string | null;
  source?: string | null;
  location?: string | null;
  employment_type?: string | null;
  category?: string | null;
  remote?: boolean;
  is_active?: boolean;
}

export interface UpdateSavedSearchInput {
  name?: string;
  search?: string | null;
  source?: string | null;
  location?: string | null;
  employment_type?: string | null;
  category?: string | null;
  remote?: boolean;
  is_active?: boolean;
}

export interface JobAlert {
  id: number;
  saved_search_id: number;
  job_id: number;
  read_at?: string;
  created_at: string;
}

export interface JobAlertWithDetails extends JobAlert {
  job_title: string;
  job_company: string;
  job_location: string;
  job_url: string;
  job_source: string;
  job_category: string;
  job_employment_type: string;
  saved_search_name: string;
}
