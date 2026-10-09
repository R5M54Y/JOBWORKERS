// JOBWORKERS Alerts View
// Frontend JSX component for /alerts page

import { html } from 'hono/html';

interface JobAlert {
  id: number;
  saved_search_id: number;
  job_id: number;
  read_at?: string;
  created_at: string;
  job_title: string;
  job_company: string;
  job_location: string;
  job_url: string;
  job_source: string;
  job_category: string;
  job_employment_type: string;
  saved_search_name: string;
}

interface AlertsViewProps {
  alerts: any[];
  unreadCount: number;
  user?: any;
  branding?: any;
}

export const AlertsView = ({ alerts, unreadCount, user }: AlertsViewProps) => {
  return html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Alerts - JOBWORKERS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        header { background: #fff; padding: 20px 0; border-bottom: 1px solid #ddd; margin-bottom: 30px; }
        nav { display: flex; gap: 20px; align-items: center; }
        nav a { text-decoration: none; color: #0066cc; font-weight: 500; }
        nav a:hover { text-decoration: underline; }
        h1 { font-size: 28px; margin-bottom: 10px; }
        .page-title { margin-bottom: 30px; }
        .page-title p { color: #666; margin-top: 5px; }
        .alerts-list { display: grid; gap: 15px; }
        .alert-item { background: #fff; border: 1px solid #ddd; border-left: 4px solid #0066cc; border-radius: 6px; padding: 20px; }
        .alert-item.unread { background: #f0f7ff; border-left-color: #0066cc; }
        .alert-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; }
        .job-title { font-size: 18px; font-weight: 600; color: #0066cc; text-decoration: none; }
        .job-title:hover { text-decoration: underline; }
        .alert-meta { display: flex; gap: 15px; font-size: 14px; color: #666; flex-wrap: wrap; }
        .badge { background: #e0e0e0; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
        .badge-search { background: #cce5ff; color: #0066cc; }
        .badge-new { background: #ffcccc; color: #cc0000; font-weight: 600; }
        .job-details { display: grid; gap: 8px; margin: 15px 0; }
        .job-detail-row { display: flex; gap: 10px; font-size: 14px; }
        .job-detail-row strong { min-width: 80px; color: #666; }
        .job-actions { display: flex; gap: 10px; margin-top: 15px; }
        .btn { padding: 10px 16px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; text-decoration: none; display: inline-block; }
        .btn:hover { background: #f5f5f5; }
        .btn-primary { background: #0066cc; color: white; border-color: #0066cc; }
        .btn-primary:hover { background: #0052a3; }
        .btn-secondary { background: #6c757d; color: white; border-color: #6c757d; }
        .btn-secondary:hover { background: #5a6268; }
        .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 8px; }
        .empty-state h2 { margin-bottom: 10px; }
        .empty-state p { color: #666; margin-bottom: 20px; }
        .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; }
        .filter-btn { padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; }
        .filter-btn.active { background: #0066cc; color: white; border-color: #0066cc; }
        @media (max-width: 640px) {
          .alert-header { flex-direction: column; }
          .job-actions { flex-direction: column; }
          .btn { width: 100%; }
          .job-title { font-size: 16px; }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="container">
          <nav>
            <a href="/">← Back to Jobs</a>
            <a href="/saved-searches">Saved Searches</a>
            <a href="/account">Account</a>
            <a href="/saved-jobs">Saved Jobs</a>
          </nav>
        </div>
      </header>

      <main class="container">
        <div class="page-title">
          <h1>Job Alerts</h1>
          <p>${unreadCount > 0 ? html`You have <strong>${unreadCount} new alert${unreadCount !== 1 ? 's' : ''}</strong>` : 'No new alerts'}</p>
        </div>

        ${alerts.length > 0 ? html`
          <div class="filter-bar">
            <button class="filter-btn active" onclick="location.href='/alerts'">All (${alerts.length})</button>
            <button class="filter-btn" onclick="location.href='/alerts?unread=true'">Unread (${unreadCount})</button>
          </div>

          <div class="alerts-list">
            ${alerts.map((alert) => html`
              <div class="alert-item ${!alert.read_at ? 'unread' : ''}">
                <div class="alert-header">
                  <a href="/jobs/${alert.job_id}" class="job-title">${alert.job_title}</a>
                  <div style="display: flex; gap: 8px;">
                    ${!alert.read_at ? html`<span class="badge badge-new">NEW</span>` : ''}
                    <span class="badge badge-search">${alert.saved_search_name}</span>
                  </div>
                </div>

                <div class="alert-meta">
                  <span><strong>${alert.job_company}</strong></span>
                  <span>${alert.job_location}</span>
                  <span>${alert.job_employment_type}</span>
                  ${alert.job_category ? html`<span>${alert.job_category}</span>` : ''}
                  <span style="color: #999;">from ${alert.job_source}</span>
                </div>

                <div class="job-details">
                  <div class="job-detail-row">
                    <strong>Found:</strong> ${new Date(alert.created_at).toLocaleDateString()} ${new Date(alert.created_at).toLocaleTimeString()}
                  </div>
                </div>

                <div class="job-actions">
                  <a href="/jobs/${alert.job_id}" class="btn btn-primary">View Job</a>
                  <button onclick="saveJob(${alert.job_id})" class="btn">Save Job</button>
                  ${!alert.read_at ? html`
                    <button onclick="markRead(${alert.id})" class="btn btn-secondary">Mark as Read</button>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="empty-state">
            <h2>No alerts yet</h2>
            <p>Create a saved search to automatically receive alerts for new matching jobs</p>
            <a href="/saved-searches" class="btn btn-primary" style="display: inline-block;">View Saved Searches</a>
          </div>
        `}
      </main>

      <script>
        function saveJob(jobId) {
          fetch(\`/api/jobs/\${jobId}/save\`, { method: 'POST' })
            .then(r => r.ok ? alert('Job saved!') : alert('Failed to save'))
            .catch(e => alert('Error: ' + e.message));
        }
        
        function markRead(alertId) {
          fetch(\`/api/job-alerts/\${alertId}\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true })
          })
            .then(r => r.ok ? location.reload() : alert('Failed to mark as read'))
            .catch(e => alert('Error: ' + e.message));
        }
      </script>
    </body>
    </html>
  `;
};
