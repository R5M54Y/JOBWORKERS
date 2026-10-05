// JOBWORKERS Saved Jobs Page
// Server-rendered saved jobs listing for authenticated users

import { html } from 'hono/html';
import { Layout } from './Layout';
import type { SafeUser } from '../types/auth';

interface SavedJobsViewProps {
  jobs: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  user: SafeUser;
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

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export const SavedJobsView = ({ jobs, pagination, user }: SavedJobsViewProps) => {
  const currentPage = pagination.page;
  const totalPages = pagination.total_pages;
  
  return Layout({
    title: 'Saved Jobs',
    children: html`
      <h1>Saved Jobs</h1>
      
      <div class="saved-jobs-header">
        <p class="results-count">
          ${pagination.total === 0 ? 'No saved jobs' : `${pagination.total} saved job${pagination.total !== 1 ? 's' : ''}`}
        </p>
      </div>
      
      ${jobs.length === 0 ? html`
        <div class="empty-state">
          <h2>No saved jobs yet</h2>
          <p>Start exploring and save jobs to view them here</p>
          <br/>
          <a href="/" class="search-button">Explore Jobs</a>
        </div>
      ` : ''}
      
      ${jobs.map(job => html`
        <div class="saved-job-card">
          <div class="saved-job-header">
            <h2><a href="/jobs/${job.id}" style="color: #2563eb; text-decoration: none;">${job.title}</a></h2>
            <form method="POST" action="/api/jobs/${job.id}/save?_method=DELETE" style="display: inline;">
              <button type="submit" class="unsave-button" title="Remove from saved">★ Saved</button>
            </form>
          </div>
          
          <div class="saved-job-meta">
            <span><strong>${job.company}</strong></span>
            <span>📍 ${job.location}</span>
            <span class="badge">${job.employment_type}</span>
            <span class="badge">${job.source}</span>
            <span>Saved ${formatDate(job.saved_at)}</span>
          </div>
          
          <div class="saved-job-description">
            ${truncate(job.description.replace(/<[^>]*>/g, ''), 200)}
          </div>
          
          <div class="saved-job-actions">
            <a href="/jobs/${job.id}" class="job-link">View Job →</a>
          </div>
        </div>
      `).join('')}
      
      ${totalPages > 1 ? html`
        <div class="pagination">
          <form method="GET" action="/saved-jobs" style="display: contents;">
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
      
      <style>
        h1 {
          font-size: 2rem;
          margin-bottom: 2rem;
        }
        
        .saved-jobs-header {
          margin-bottom: 1.5rem;
        }
        
        .results-count {
          font-size: 0.875rem;
          color: #666;
        }
        
        .saved-job-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        
        .saved-job-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        
        .saved-job-header h2 {
          font-size: 1.25rem;
          margin: 0;
        }
        
        .unsave-button {
          padding: 0.5rem 1rem;
          background: #fbbf24;
          color: #1f2937;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .unsave-button:hover {
          background: #f59e0b;
        }
        
        .saved-job-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.75rem;
        }
        
        .saved-job-description {
          color: #555;
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        .saved-job-actions {
          display: flex;
          gap: 1rem;
        }
        
        .job-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .job-link:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .saved-job-header {
            flex-direction: column;
          }
          
          .unsave-button {
            width: 100%;
          }
        }
      </style>
    `,
  });
};
