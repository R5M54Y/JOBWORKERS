// JOBWORKERS Applications Page
// Server-rendered applications dashboard for authenticated users

import { html } from 'hono/html';
import { Layout } from './Layout';
import type { SafeUser } from '../types/auth';
import type { ApplicationWithJob } from '../types/application';
import { REVERSE_STATUS_MAP } from '../types/application';

interface ApplicationsViewProps {
  applications: ApplicationWithJob[];
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
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    applied: '#3b82f6',
    interview: '#f59e0b',
    offer: '#10b981',
    rejected: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

export const ApplicationsView = ({ applications, pagination, user }: ApplicationsViewProps) => {
  const currentPage = pagination.page;
  const totalPages = pagination.total_pages;
  
  return Layout({
    title: 'My Applications',
    children: html`
      <h1>My Applications</h1>
      
      <div class="applications-header">
        <p class="results-count">
          ${pagination.total === 0 ? 'No applications' : `${pagination.total} application${pagination.total !== 1 ? 's' : ''}`}
        </p>
      </div>
      
      ${applications.length === 0 ? html`
        <div class="empty-state">
          <h2>No applications yet</h2>
          <p>Start tracking jobs you're pursuing to stay organized</p>
          <br/>
          <a href="/" class="search-button">Explore Jobs</a>
        </div>
      ` : ''}
      
      ${applications.map(app => html`
        <div class="application-card">
          <div class="application-header">
            <div>
              <h2><a href="/jobs/${app.job?.id}" style="color: #2563eb; text-decoration: none;">${app.job?.title}</a></h2>
              <p class="company">${app.job?.company}</p>
            </div>
            <div class="status-badge" style="background-color: ${getStatusColor(app.status)}; color: white;">
              ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
            </div>
          </div>
          
          <div class="application-meta">
            <span>📍 ${app.job?.location}</span>
            <span>Source: ${app.job?.source}</span>
            <span>Applied: ${formatDate(app.applied_at)}</span>
            <span>Updated: ${formatDate(app.updated_at)}</span>
          </div>
          
          <div class="application-actions">
            <a href="/jobs/${app.job?.id}" class="view-job-link">View Job →</a>
            <a href="/jobs/${app.job?.id}#application" class="update-status-link">Update Status</a>
          </div>
        </div>
      `).join('')}
      
      ${totalPages > 1 ? html`
        <div class="pagination">
          <form method="GET" action="/applications" style="display: contents;">
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
        
        .applications-header {
          margin-bottom: 1.5rem;
        }
        
        .results-count {
          font-size: 0.875rem;
          color: #666;
        }
        
        .application-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        
        .application-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .application-header h2 {
          font-size: 1.25rem;
          margin: 0;
        }
        
        .company {
          font-weight: 600;
          color: #555;
          margin: 0.25rem 0 0 0;
        }
        
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .application-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 1rem;
        }
        
        .application-actions {
          display: flex;
          gap: 1rem;
        }
        
        .view-job-link,
        .update-status-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .view-job-link:hover,
        .update-status-link:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .application-header {
            flex-direction: column;
          }
          
          .status-badge {
            width: 100%;
            text-align: center;
          }
        }
      </style>
    `,
  });
};
