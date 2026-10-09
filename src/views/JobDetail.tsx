// JOBWORKERS Job Detail View
// Professional Bootstrap 5 job posting detail

import { html, raw } from 'hono/html';
import { Layout } from './Layout';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import type { Job } from '../types/job';

interface JobDetailViewProps {
  job: Job;
  user?: any;
  branding?: any;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
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
    "employmentType": job.employment_type.toUpperCase().replace(/-/g, '_'),
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
      
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="/">Job Explorer</a></li>
          <li class="breadcrumb-item active" aria-current="page">${job.title}</li>
        </ol>
      </nav>
      
      <div class="row g-4">
        <!-- Main Content -->
        <div class="col-md-8">
          <!-- Job Header Card -->
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 class="h2 fw-bold mb-2 text-dark">${job.title}</h1>
                  <h4 class="h5 text-muted mb-0">
                    <i class="bi bi-building me-2 text-primary"></i>
                    ${job.company}
                  </h4>
                </div>
              </div>
              
              <!-- Quick Info Badges -->
              <div class="d-flex flex-wrap gap-2 mt-4">
                <span class="badge bg-primary bg-opacity-10 text-primary fs-6">
                  <i class="bi bi-clock-history me-1"></i>
                  ${job.employment_type}
                </span>
                <span class="badge bg-secondary bg-opacity-10 text-secondary fs-6">
                  <i class="bi bi-tag me-1"></i>
                  ${job.source}
                </span>
                ${job.category ? html`
                  <span class="badge bg-info bg-opacity-10 text-info fs-6">
                    <i class="bi bi-folder me-1"></i>
                    ${job.category}
                  </span>
                ` : ''}
                <span class="badge bg-light text-dark fs-6 ms-auto">
                  <i class="bi bi-calendar-event me-1"></i>
                  Posted ${formatDate(typeof job.created_at === 'string' ? job.created_at : job.created_at.toString())}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Job Details Grid -->
          <div class="row g-3 mb-4">
            <div class="col-sm-6">
              <div class="card border-0 bg-light">
                <div class="card-body">
                  <p class="text-muted small mb-1">
                    <i class="bi bi-geo-alt me-1"></i>
                    LOCATION
                  </p>
                  <p class="h6 mb-0 fw-semibold">${job.location}</p>
                </div>
              </div>
            </div>
            <div class="col-sm-6">
              <div class="card border-0 bg-light">
                <div class="card-body">
                  <p class="text-muted small mb-1">
                    <i class="bi bi-briefcase me-1"></i>
                    JOB TYPE
                  </p>
                  <p class="h6 mb-0 fw-semibold text-capitalize">${job.employment_type}</p>
                </div>
              </div>
            </div>
            ${job.salary_min || job.salary_max ? html`
              <div class="col-sm-6">
                <div class="card border-0 bg-light">
                  <div class="card-body">
                    <p class="text-muted small mb-1">
                      <i class="bi bi-currency-dollar me-1"></i>
                      SALARY RANGE
                    </p>
                    <p class="h6 mb-0 fw-semibold">
                      ${job.salary_min ? formatCurrency(job.salary_min) : ''}
                      ${job.salary_min && job.salary_max ? ' - ' : ''}
                      ${job.salary_max ? formatCurrency(job.salary_max) : 'Negotiable'}
                    </p>
                  </p>
                </div>
              </div>
            ` : ''}
            <div class="col-sm-6">
              <div class="card border-0 bg-light">
                <div class="card-body">
                  <p class="text-muted small mb-1">
                    <i class="bi bi-tag me-1"></i>
                    CATEGORY
                  </p>
                  <p class="h6 mb-0 fw-semibold text-capitalize">${job.category || 'General'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Ad Container -->
          <div class="mb-4">
            <script async="async" data-cfasync="false" src="https://pl31517494.profitableratecpmnetwork.com/93be112345a2807dbde6fc7c69a63baf/invoke.js"></script>
            <div id="container-93be112345a2807dbde6fc7c69a63baf"></div>
          </div>
          
          <!-- Job Description -->
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-body p-4">
              <h5 class="card-title fw-bold mb-3">
                <i class="bi bi-file-text me-2 text-primary"></i>
                Job Description
              </h5>
              <div class="job-detail-description lh-lg">
                ${raw(cleanDescription)}
              </div>
            </div>
          </div>
          
          <!-- Apply Button (Full Width on Mobile) -->
          <a 
            href="${job.url}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-primary btn-lg w-100 fw-semibold"
          >
            <i class="bi bi-box-arrow-up-right me-2"></i>Apply for This Position
          </a>
        </div>
        
        <!-- Sidebar -->
        <div class="col-md-4">
          <!-- Source Card -->
          <div class="card shadow-sm border-0 mb-3">
            <div class="card-body p-3">
              <p class="text-muted small mb-2">
                <i class="bi bi-info-circle me-1"></i>
                JOB SOURCE
              </p>
              <p class="h6 fw-semibold mb-0 text-capitalize">${job.source}</p>
            </div>
          </div>
          
          <!-- Application Links -->
          <div class="card shadow-sm border-0 mb-3">
            <div class="card-body p-3">
              <h6 class="card-title fw-bold mb-3">
                <i class="bi bi-link-45deg me-2 text-primary"></i>
                Apply Directly
              </h6>
              <a 
                href="${job.url}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn btn-primary btn-sm w-100"
              >
                <i class="bi bi-external-link me-1"></i>Open Job Posting
              </a>
            </div>
          </div>
          
          <!-- Share Card -->
          <div class="card shadow-sm border-0 mb-3">
            <div class="card-body p-3">
              <h6 class="card-title fw-bold mb-3">
                <i class="bi bi-share me-2 text-primary"></i>
                Share
              </h6>
              <button 
                type="button"
                class="btn btn-outline-secondary btn-sm w-100"
                onclick="navigator.clipboard.writeText(window.location.href).then(() => { this.innerHTML = '<i class=\\'bi bi-check-circle me-1\\'></i>Link Copied!'; setTimeout(() => { this.innerHTML = '<i class=\\'bi bi-copy me-1\\'></i>Copy Link'; }, 2000); })"
              >
                <i class="bi bi-copy me-1"></i>Copy Link
              </button>
            </div>
          </div>
          
          <!-- Meta Info Card -->
          <div class="card shadow-sm border-0">
            <div class="card-body p-3">
              <h6 class="card-title fw-bold mb-3">
                <i class="bi bi-shield-check me-2 text-primary"></i>
                Verified Info
              </h6>
              <dl class="row mb-0">
                <dt class="col-sm-5 text-muted small">ID</dt>
                <dd class="col-sm-7 small text-monospace">${job.id}</dd>
                
                <dt class="col-sm-5 text-muted small">Posted</dt>
                <dd class="col-sm-7 small">${formatDate(typeof job.created_at === 'string' ? job.created_at : job.created_at.toString())}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};
