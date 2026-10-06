// JOBWORKERS Job Detail View
// Server-rendered job detail page

import { html } from 'hono/html';
import { Layout } from './Layout';
import type { Job } from '../types/job';

interface JobDetailViewProps {
  job: Job;
  user?: any;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function sanitizeHtml(dirty: string): string {
  // Remove dangerous tags and attributes
  return dirty
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
}

export const JobDetailView = ({ job, user }: JobDetailViewProps) => {
  const cleanDescription = sanitizeHtml(job.description);
  
  return Layout({
    title: job.title,
    user,
    children: html`
      <a href="/" class="back-link">← Back to Job Explorer</a>
      
      <div class="job-detail">
        <h1>${job.title}</h1>
        
        <div class="job-detail-meta">
          <div class="job-detail-meta-item">
            <span class="job-detail-meta-label">Company</span>
            <span class="job-detail-meta-value">${job.company}</span>
          </div>
          
          <div class="job-detail-meta-item">
            <span class="job-detail-meta-label">Location</span>
            <span class="job-detail-meta-value">${job.location}</span>
          </div>
          
          <div class="job-detail-meta-item">
            <span class="job-detail-meta-label">Job Type</span>
            <span class="job-detail-meta-value">${job.employment_type}</span>
          </div>
          
          <div class="job-detail-meta-item">
            <span class="job-detail-meta-label">Category</span>
            <span class="job-detail-meta-value">${job.category}</span>
          </div>
          
          <div class="job-detail-meta-item">
            <span class="job-detail-meta-label">Source</span>
            <span class="job-detail-meta-value">${job.source}</span>
          </div>
          
          <div class="job-detail-meta-item">
            <span class="job-detail-meta-label">Posted</span>
            <span class="job-detail-meta-value">${formatDate(typeof job.created_at === 'string' ? job.created_at : job.created_at.toString())}</span>
          </div>
          
          ${job.salary_min || job.salary_max ? html`
            <div class="job-detail-meta-item">
              <span class="job-detail-meta-label">Salary Range</span>
              <span class="job-detail-meta-value">
                ${job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}
                ${job.salary_min && job.salary_max ? ' - ' : ''}
                ${job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
              </span>
            </div>
          ` : ''}
        </div>
        
        <div class="job-detail-description">
          ${html`${cleanDescription}`}
        </div>
        
        <a 
          href="${job.url}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="apply-button"
        >
          Apply for this job →
        </a>
      </div>
    `,
  });
};
