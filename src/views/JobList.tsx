// JOBWORKERS Job List View
// Server-rendered job explorer

import { html } from 'hono/html';
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

export const JobListView = ({ jobs, pagination, filters, availableCategories = [] }: JobListProps) => {
  const currentPage = pagination.page;
  const totalPages = pagination.total_pages;
  
  return Layout({
    title: 'Job Explorer',
    children: html`
      <div class="search-section">
        <form class="search-form" method="GET" action="/">
          <input 
            type="text" 
            name="search" 
            class="search-input" 
            placeholder="Search jobs by keyword..." 
            value="${filters.search || ''}"
          />
          <input 
            type="text" 
            name="location" 
            class="search-input" 
            placeholder="Location..." 
            value="${filters.location || ''}"
          />
          <button type="submit" class="search-button">Search Jobs</button>
        </form>
      </div>
      
      <div class="filters">
        <h3>Filter & Sort</h3>
        <form method="GET" action="/" class="filter-group">
          ${filters.search ? html`<input type="hidden" name="search" value="${filters.search}" />` : ''}
          ${filters.location ? html`<input type="hidden" name="location" value="${filters.location}" />` : ''}
          
          <select name="source" class="filter-select" onchange="this.form.submit()">
            <option value="">All Sources</option>
            <option value="jobicy" ${filters.source === 'jobicy' ? 'selected' : ''}>Jobicy</option>
            <option value="remotive" ${filters.source === 'remotive' ? 'selected' : ''}>Remotive</option>
          </select>
          
          <select name="job_type" class="filter-select" onchange="this.form.submit()">
            <option value="">All Employment Types</option>
            <option value="full_time" ${filters.job_type === 'full_time' ? 'selected' : ''}>Full-time</option>
            <option value="part-time" ${filters.job_type === 'part-time' ? 'selected' : ''}>Part-time</option>
            <option value="part_time" ${filters.job_type === 'part_time' ? 'selected' : ''}>Part-time (alt)</option>
            <option value="contract" ${filters.job_type === 'contract' ? 'selected' : ''}>Contract</option>
            <option value="freelance" ${filters.job_type === 'freelance' ? 'selected' : ''}>Freelance</option>
          </select>
          
          <select name="category" class="filter-select" onchange="this.form.submit()">
            <option value="">All Categories</option>
            ${availableCategories.map((cat: string) => html`
              <option value="${cat}" ${filters.category === cat ? 'selected' : ''}>${cat}</option>
            `).join('')}
          </select>
          
          <label style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
            <input type="checkbox" name="remote" value="true" ${filters.remote ? 'checked' : ''} onchange="this.form.submit()" />
            Remote Only
          </label>
          
          <select name="sort" class="filter-select" onchange="this.form.submit()">
            <option value="latest" ${!filters.sort || filters.sort === 'latest' ? 'selected' : ''}>Latest First</option>
            <option value="oldest" ${filters.sort === 'oldest' ? 'selected' : ''}>Oldest First</option>
          </select>
        </form>
      </div>
      
      <div class="results-header">
        <div class="results-count">
          Showing ${jobs.length} of ${pagination.total} jobs
        </div>
      </div>
      
      ${jobs.length === 0 ? html`
        <div class="empty-state">
          <h2>No jobs found</h2>
          <p>Try adjusting your search or filters</p>
          <br/>
          <a href="/" class="search-button">Clear Filters</a>
        </div>
      ` : ''}
      
      ${jobs.map(job => html`
        <a href="/jobs/${job.id}" style="text-decoration: none; color: inherit;">
          <div class="job-card">
            <h2>${job.title}</h2>
            <div class="job-card-meta">
              <span><strong>${job.company}</strong></span>
              <span>📍 ${job.location}</span>
              <span class="badge">${job.employment_type}</span>
              <span class="badge">${job.source}</span>
              <span>${formatDate(typeof job.created_at === 'string' ? job.created_at : job.created_at.toString())}</span>
            </div>
            <div class="job-card-description">
              ${truncate(job.description.replace(/<[^>]*>/g, ''), 200)}
            </div>
          </div>
        </a>
      `).join('')}
      
      ${totalPages > 1 ? html`
        <div class="pagination">
          <form method="GET" action="/" style="display: contents;">
            ${filters.search ? html`<input type="hidden" name="search" value="${filters.search}" />` : ''}
            ${filters.location ? html`<input type="hidden" name="location" value="${filters.location}" />` : ''}
            ${filters.source ? html`<input type="hidden" name="source" value="${filters.source}" />` : ''}
            ${filters.job_type ? html`<input type="hidden" name="job_type" value="${filters.job_type}" />` : ''}
            ${filters.category ? html`<input type="hidden" name="category" value="${filters.category}" />` : ''}
            ${filters.remote ? html`<input type="hidden" name="remote" value="true" />` : ''}
            ${filters.sort ? html`<input type="hidden" name="sort" value="${filters.sort}" />` : ''}
            
            <button 
              type="submit" 
              name="page" 
              value="1" 
              ${currentPage === 1 ? 'disabled' : ''}
            >
              First
            </button>
            
            <button 
              type="submit" 
              name="page" 
              value="${currentPage - 1}" 
              ${currentPage === 1 ? 'disabled' : ''}
            >
              Previous
            </button>
            
            <button class="active" disabled>
              ${currentPage} / ${totalPages}
            </button>
            
            <button 
              type="submit" 
              name="page" 
              value="${currentPage + 1}" 
              ${currentPage === totalPages ? 'disabled' : ''}
            >
              Next
            </button>
            
            <button 
              type="submit" 
              name="page" 
              value="${totalPages}" 
              ${currentPage === totalPages ? 'disabled' : ''}
            >
              Last
            </button>
          </form>
        </div>
      ` : ''}
    `,
  });
};
