// JOBWORKERS Job Detail View
// Server-rendered job detail page

import { html, raw } from 'hono/html';
import { Layout } from './Layout';
import { sanitizeHtml } from '../utils/sanitizeHtml';
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

export const JobDetailView = ({ job, user }: JobDetailViewProps) => {
  const cleanDescription = sanitizeHtml(job.description);
  
  // Build JobPosting schema per https://developers.google.com/search/docs/appearance/structured-data/job-posting
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": cleanDescription,
    "datePosted": job.posted_at || job.created_at,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressRegion": job.location.includes("Remote") ? "Remote" : undefined
      }
    },
    "employmentType": job.employment_type.toUpperCase().replace(/-/g, '_'), // FULL_TIME, PART_TIME, etc.
    "url": job.url,
    ...(job.salary_min || job.salary_max ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salary_min,
          "maxValue": job.salary_max,
          "unitText": "YEAR"
        }
      }
    } : {}),
    ...(job.expires_at ? { "validThrough": job.expires_at } : {})
  };
  
  return Layout({
    title: job.title,
    user,
    children: html`
      <script type="application/ld+json">
        ${raw(JSON.stringify(jobPostingSchema))}
      </script>
      
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
          ${raw(cleanDescription)}
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
