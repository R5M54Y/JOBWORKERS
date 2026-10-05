// JOBWORKERS Job List View
// Server-rendered job explorer

import { Layout } from './Layout';
import type { Job } from '../types/job';

interface JobListProps {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: {
    search?: string;
    location?: string;
    source?: string;
    job_type?: string;
    category?: string;
    sort?: string;
    remote?: boolean;
  };
  availableCategories?: string[];
  user?: any;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export const JobListView = ({ jobs, pagination, filters, availableCategories = [], user }: JobListProps) => {
  const currentPage = pagination.page;
  const totalPages = pagination.total_pages;
  
  return Layout({
    title: 'Job Explorer',
    user,
    children: (
      <>
        <div class="search-section">
          <form class="search-form" method="get" action="/">
            <input 
              type="text" 
              name="search" 
              class="search-input" 
              placeholder="Search jobs by keyword..." 
              value={filters.search || ''}
            />
            <input 
              type="text" 
              name="location" 
              class="search-input" 
              placeholder="Location..." 
              value={filters.location || ''}
            />
            <button type="submit" class="search-button">Search Jobs</button>
          </form>
        </div>
        
        <div class="filters">
          <h3>Filter & Sort</h3>
          <form method="get" action="/" class="filter-group">
            {filters.search && <input type="hidden" name="search" value={filters.search} />}
            {filters.location && <input type="hidden" name="location" value={filters.location} />}
            {filters.source && <input type="hidden" name="source" value={filters.source} />}
            {filters.job_type && <input type="hidden" name="job_type" value={filters.job_type} />}
            {filters.category && <input type="hidden" name="category" value={filters.category} />}
            {filters.remote && <input type="hidden" name="remote" value="true" />}
            {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
            
            <select name="source" class="filter-select" onchange="this.form.submit()">
              <option value="">All Sources</option>
              <option value="remoteok" selected={filters.source === 'remoteok'}>RemoteOK</option>
              <option value="remotive" selected={filters.source === 'remotive'}>Remotive</option>
              <option value="jobicy" selected={filters.source === 'jobicy'}>Jobicy</option>
            </select>
            
            <select name="job_type" class="filter-select" onchange="this.form.submit()">
              <option value="">All Types</option>
              <option value="full-time" selected={filters.job_type === 'full-time'}>Full-time</option>
              <option value="part-time" selected={filters.job_type === 'part-time'}>Part-time</option>
              <option value="contract" selected={filters.job_type === 'contract'}>Contract</option>
            </select>
            
            <select name="category" class="filter-select" onchange="this.form.submit()">
              <option value="">All Categories</option>
              {availableCategories.map(cat => (
                <option value={cat} selected={filters.category === cat}>{cat}</option>
              ))}
            </select>
            
            <select name="sort" class="filter-select" onchange="this.form.submit()">
              <option value="latest" selected={filters.sort === 'latest'}>Newest First</option>
              <option value="oldest" selected={filters.sort === 'oldest'}>Oldest First</option>
            </select>
          </form>
        </div>
        
        <div class="results-header">
          <span class="results-count">{pagination.total} jobs found</span>
        </div>
        
        <div class="job-list">
          {jobs.map(job => (
            <a href={`/jobs/${job.id}`} style="text-decoration: none; color: inherit;">
              <div class="job-card">
                <h2>{job.title}</h2>
                <div class="job-card-meta">
                  <span><strong>{job.company}</strong></span>
                  <span>📍 {job.location}</span>
                  <span class="badge">{job.employment_type}</span>
                  <span class="badge">{job.source}</span>
                  <span>{formatDate(typeof job.created_at === 'string' ? job.created_at : job.created_at.toString())}</span>
                </div>
                <div class="job-card-description">
                  {truncate(job.description.replace(/<[^>]*>/g, ''), 200)}
                </div>
              </div>
            </a>
          ))}
        </div>
        
        {totalPages > 1 && (
          <div class="pagination">
            <form method="get" action="/" style="display: contents;">
              {filters.search && <input type="hidden" name="search" value={filters.search} />}
              {filters.location && <input type="hidden" name="location" value={filters.location} />}
              {filters.source && <input type="hidden" name="source" value={filters.source} />}
              {filters.job_type && <input type="hidden" name="job_type" value={filters.job_type} />}
              {filters.category && <input type="hidden" name="category" value={filters.category} />}
              {filters.remote && <input type="hidden" name="remote" value="true" />}
              {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
              
              <button 
                type="submit" 
                name="page" 
                value="1" 
                disabled={currentPage === 1}
              >
                First
              </button>
              
              <button 
                type="submit" 
                name="page" 
                value={currentPage - 1} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <button class="active" disabled>
                {currentPage} / {totalPages}
              </button>
              
              <button 
                type="submit" 
                name="page" 
                value={currentPage + 1} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              
              <button 
                type="submit" 
                name="page" 
                value={totalPages} 
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </form>
          </div>
        )}
      </>
    ),
  });
};
