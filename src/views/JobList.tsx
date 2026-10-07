// JOBWORKERS Job List View
// Professional Bootstrap 5 job explorer

import { Layout } from './Layout';
import { stripHtml } from '../utils/sanitizeHtml';
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
        {/* Hero Search Section */}
        <div class="card shadow-sm mb-4">
          <div class="card-body p-4">
            <h2 class="h4 mb-4 fw-bold">
              <i class="bi bi-search text-primary me-2"></i>
              Find Your Next Remote Opportunity
            </h2>
            <form method="get" action="/">
              <div class="row g-3">
                <div class="col-md-5">
                  <div class="input-group input-group-lg">
                    <span class="input-group-text bg-white">
                      <i class="bi bi-briefcase text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      name="search" 
                      class="form-control form-control-lg" 
                      placeholder="Job title, keywords, or company..." 
                      value={filters.search || ''}
                    />
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="input-group input-group-lg">
                    <span class="input-group-text bg-white">
                      <i class="bi bi-geo-alt text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      name="location" 
                      class="form-control form-control-lg" 
                      placeholder="Location or Remote" 
                      value={filters.location || ''}
                    />
                  </div>
                </div>
                <div class="col-md-3">
                  <button type="submit" class="btn btn-primary btn-lg w-100">
                    <i class="bi bi-search me-2"></i>Search Jobs
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Filters Section */}
        <div class="card shadow-sm mb-4">
          <div class="card-body p-4">
            <h5 class="mb-3 fw-bold">
              <i class="bi bi-funnel text-primary me-2"></i>
              Filter & Sort
            </h5>
            <form method="get" action="/">
              {filters.search && <input type="hidden" name="search" value={filters.search} />}
              {filters.location && <input type="hidden" name="location" value={filters.location} />}
              
              <div class="row g-3">
                <div class="col-md-3">
                  <label class="form-label small fw-semibold text-muted">Source</label>
                  <select name="source" class="form-select" onchange="this.form.submit()">
                    <option value="">All Sources</option>
                    <option value="remoteok" selected={filters.source === 'remoteok'}>RemoteOK</option>
                    <option value="remotive" selected={filters.source === 'remotive'}>Remotive</option>
                    <option value="jobicy" selected={filters.source === 'jobicy'}>Jobicy</option>
                    <option value="ashby" selected={filters.source === 'ashby'}>Ashby</option>
                    <option value="lever" selected={filters.source === 'lever'}>Lever</option>
                  </select>
                </div>
                
                <div class="col-md-3">
                  <label class="form-label small fw-semibold text-muted">Job Type</label>
                  <select name="job_type" class="form-select" onchange="this.form.submit()">
                    <option value="">All Types</option>
                    <option value="full-time" selected={filters.job_type === 'full-time'}>Full-time</option>
                    <option value="part-time" selected={filters.job_type === 'part-time'}>Part-time</option>
                    <option value="contract" selected={filters.job_type === 'contract'}>Contract</option>
                    <option value="freelance" selected={filters.job_type === 'freelance'}>Freelance</option>
                  </select>
                </div>
                
                <div class="col-md-3">
                  <label class="form-label small fw-semibold text-muted">Category</label>
                  <select name="category" class="form-select" onchange="this.form.submit()">
                    <option value="">All Categories</option>
                    {availableCategories.map(cat => (
                      <option value={cat} selected={filters.category === cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div class="col-md-3">
                  <label class="form-label small fw-semibold text-muted">Sort By</label>
                  <select name="sort" class="form-select" onchange="this.form.submit()">
                    <option value="latest" selected={filters.sort === 'latest'}>Newest First</option>
                    <option value="oldest" selected={filters.sort === 'oldest'}>Oldest First</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Ad Container */}
        <div class="mb-4">
          <script async data-cfasync="false" src="https://pl31517494.profitableratecpmnetwork.com/93be112345a2807dbde6fc7c69a63baf/invoke.js"></script>
          <div id="container-93be112345a2807dbde6fc7c69a63baf"></div>
        </div>
        
        {/* Results Header */}
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0 text-muted">
            <i class="bi bi-journal-text me-2"></i>
            <strong class="text-dark">{pagination.total}</strong> jobs found
          </h5>
          {filters.search || filters.location || filters.source || filters.job_type || filters.category ? (
            <a href="/" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-x-circle me-1"></i>Clear Filters
            </a>
          ) : ''}
        </div>
        
        {/* Job Listings */}
        {jobs.length > 0 ? (
          <div class="row g-3">
            {jobs.map(job => (
              <div class="col-12">
                <a href={`/jobs/${job.id}`} class="text-decoration-none">
                  <div class="card job-card h-100 border-0 shadow-sm">
                    <div class="card-body p-4">
                      <div class="row">
                        <div class="col">
                          <h5 class="card-title mb-2 fw-bold text-primary">
                            {job.title}
                          </h5>
                          <h6 class="card-subtitle mb-3 text-muted">
                            <i class="bi bi-building me-1"></i>
                            <strong>{job.company}</strong>
                            <span class="mx-2">•</span>
                            <i class="bi bi-geo-alt me-1"></i>
                            {job.location}
                          </h6>
                          <p class="card-text text-muted small mb-3">
                            {truncate(stripHtml(job.description), 180)}
                          </p>
                          <div class="d-flex flex-wrap gap-2">
                            <span class="badge bg-primary bg-opacity-10 text-primary">
                              <i class="bi bi-clock me-1"></i>
                              {job.employment_type}
                            </span>
                            <span class="badge bg-secondary bg-opacity-10 text-secondary">
                              <i class="bi bi-tag me-1"></i>
                              {job.source}
                            </span>
                            {job.category && (
                              <span class="badge bg-info bg-opacity-10 text-info">
                                <i class="bi bi-folder me-1"></i>
                                {job.category}
                              </span>
                            )}
                            <span class="badge bg-light text-dark ms-auto">
                              <i class="bi bi-calendar3 me-1"></i>
                              {formatDate(typeof job.created_at === 'string' ? job.created_at : job.created_at.toString())}
                            </span>
                          </div>
                        </div>
                        <div class="col-auto d-flex align-items-center">
                          <i class="bi bi-chevron-right text-muted fs-4"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div class="card shadow-sm">
            <div class="card-body text-center py-5">
              <i class="bi bi-inbox display-1 text-muted mb-3"></i>
              <h4 class="mb-2">No Jobs Found</h4>
              <p class="text-muted mb-4">Try adjusting your search or filters</p>
              <a href="/" class="btn btn-primary">
                <i class="bi bi-arrow-counterclockwise me-2"></i>Reset Filters
              </a>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Job listings pagination" class="mt-4">
            <form method="get" action="/">
              {filters.search && <input type="hidden" name="search" value={filters.search} />}
              {filters.location && <input type="hidden" name="location" value={filters.location} />}
              {filters.source && <input type="hidden" name="source" value={filters.source} />}
              {filters.job_type && <input type="hidden" name="job_type" value={filters.job_type} />}
              {filters.category && <input type="hidden" name="category" value={filters.category} />}
              {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
              
              <ul class="pagination justify-content-center">
                <li class={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    type="submit" 
                    name="page" 
                    value="1" 
                    class="page-link"
                    disabled={currentPage === 1}
                  >
                    <i class="bi bi-chevron-bar-left"></i>
                  </button>
                </li>
                
                <li class={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    type="submit" 
                    name="page" 
                    value={currentPage - 1} 
                    class="page-link"
                    disabled={currentPage === 1}
                  >
                    <i class="bi bi-chevron-left"></i> Previous
                  </button>
                </li>
                
                <li class="page-item active">
                  <span class="page-link">
                    {currentPage} of {totalPages}
                  </span>
                </li>
                
                <li class={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    type="submit" 
                    name="page" 
                    value={currentPage + 1} 
                    class="page-link"
                    disabled={currentPage === totalPages}
                  >
                    Next <i class="bi bi-chevron-right"></i>
                  </button>
                </li>
                
                <li class={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    type="submit" 
                    name="page" 
                    value={totalPages} 
                    class="page-link"
                    disabled={currentPage === totalPages}
                  >
                    <i class="bi bi-chevron-bar-right"></i>
                  </button>
                </li>
              </ul>
            </form>
          </nav>
        )}
      </>
    ),
  });
};
