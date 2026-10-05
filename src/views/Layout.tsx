// JOBWORKERS Frontend Layout
// Base HTML layout for server-rendered pages

import { html } from 'hono/html';

interface LayoutProps {
  title: string;
  children: any;
  user?: any;
}

export const Layout = ({ title, children, user }: LayoutProps) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - JOBWORKERS</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        header {
          background: #2563eb;
          color: white;
          padding: 1rem 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        header h1 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        header p {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-top: 0.25rem;
        }
        
        main {
          padding: 2rem 0;
        }
        
        .search-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }
        
        .search-form {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .search-button {
          padding: 0.75rem 2rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 500;
        }
        
        .search-button:hover {
          background: #1d4ed8;
        }
        
        .filters {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }
        
        .filters h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: #666;
        }
        
        .filter-group {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .filter-select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 0.875rem;
        }
        
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .results-count {
          font-size: 0.875rem;
          color: #666;
        }
        
        .job-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
          transition: box-shadow 0.2s;
          cursor: pointer;
        }
        
        .job-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .job-card h2 {
          font-size: 1.25rem;
          color: #2563eb;
          margin-bottom: 0.5rem;
        }
        
        .job-card-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.75rem;
        }
        
        .job-card-description {
          color: #555;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        
        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #e5e7eb;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin: 2rem 0;
        }
        
        .pagination button {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .pagination button:hover:not(:disabled) {
          background: #f9fafb;
        }
        
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination button.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 8px;
        }
        
        .empty-state h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .error-state {
          text-align: center;
          padding: 4rem 2rem;
          background: #fee;
          border-radius: 8px;
          color: #c00;
        }
        
        .job-detail {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .job-detail h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #111;
        }
        
        .job-detail-meta {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .job-detail-meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .job-detail-meta-label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .job-detail-meta-value {
          font-size: 1rem;
          color: #111;
          font-weight: 500;
        }
        
        .job-detail-description {
          line-height: 1.8;
          color: #444;
          margin-bottom: 2rem;
        }
        
        .apply-button {
          display: inline-block;
          padding: 1rem 3rem;
          background: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1.125rem;
          text-align: center;
        }
        
        .apply-button:hover {
          background: #1d4ed8;
        }
        
        .back-link {
          display: inline-block;
          margin-bottom: 1.5rem;
          color: #2563eb;
          text-decoration: none;
          font-size: 0.875rem;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .search-form {
            flex-direction: column;
          }
          
          .search-input {
            width: 100%;
          }
          
          .filter-group {
            flex-direction: column;
          }
          
          .filter-select {
            width: 100%;
          }
          
          .results-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .job-detail h1 {
            font-size: 1.5rem;
          }
          
          .apply-button {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1>JOBWORKERS</h1>
            <p>Remote job opportunities aggregated from top sources</p>
          </div>
          <nav style="display: flex; gap: 1.5rem; align-items: center; font-size: 0.875rem;">
            <a href="/" style="color: white; text-decoration: none; font-weight: 500;">Jobs</a>
            ${user ? html`
              <a href="/saved-searches" style="color: white; text-decoration: none; font-weight: 500;">Saved Searches</a>
              <a href="/alerts" style="color: white; text-decoration: none; font-weight: 500;">Alerts</a>
              <a href="/saved-jobs" style="color: white; text-decoration: none; font-weight: 500;">Saved Jobs</a>
              <a href="/applications" style="color: white; text-decoration: none; font-weight: 500;">Applications</a>
              <a href="/account" style="color: white; text-decoration: none; font-weight: 500;">Account</a>
            ` : html`
              <a href="/login" style="color: white; text-decoration: none; font-weight: 500;">Login</a>
              <a href="/register" style="color: white; text-decoration: none; font-weight: 500;">Register</a>
            `}
          </nav>
        </div>
      </header>
      <main class="container">
        ${children}
      </main>
    </body>
  </html>
`;
