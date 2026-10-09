// JOBWORKERS Saved Searches View
// Frontend JSX component for /saved-searches page

import { html } from 'hono/html';

interface SavedSearch {
  id: number;
  name: string;
  search?: string;
  source?: string;
  location?: string;
  employment_type?: string;
  category?: string;
  remote: number;
  is_active: number;
  created_at: string;
}

interface SavedSearchesViewProps {
  searches: any[];
  unreadAlertCounts: Record<number, number>;
  user?: any;
  branding?: any;
}

export const SavedSearchesView = ({ searches, unreadAlertCounts, user }: SavedSearchesViewProps) => {
  return html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Saved Searches - JOBWORKERS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { background: #fff; padding: 20px 0; border-bottom: 1px solid #ddd; margin-bottom: 30px; }
        nav { display: flex; gap: 20px; align-items: center; }
        nav a { text-decoration: none; color: #0066cc; font-weight: 500; }
        nav a:hover { text-decoration: underline; }
        h1 { font-size: 28px; margin-bottom: 10px; }
        .page-title { margin-bottom: 30px; }
        .page-title p { color: #666; margin-top: 5px; }
        .create-btn { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; text-decoration: none; display: inline-block; }
        .create-btn:hover { background: #0052a3; }
        .searches-grid { display: grid; gap: 20px; }
        .search-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .search-card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; }
        .search-card-title { font-size: 18px; font-weight: 600; }
        .alert-badge { background: #ff6b6b; color: white; border-radius: 12px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
        .search-card-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
        .filter-tag { background: #f0f0f0; padding: 6px 12px; border-radius: 4px; font-size: 13px; }
        .search-card-actions { display: flex; gap: 10px; }
        .btn { padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; text-decoration: none; display: inline-block; }
        .btn:hover { background: #f5f5f5; }
        .btn-primary { background: #0066cc; color: white; border-color: #0066cc; }
        .btn-primary:hover { background: #0052a3; }
        .btn-danger { background: #ff6b6b; color: white; border-color: #ff6b6b; }
        .btn-danger:hover { background: #fa5252; }
        .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 8px; }
        .empty-state h2 { margin-bottom: 10px; }
        .empty-state p { color: #666; margin-bottom: 20px; }
        .status-active { color: #51cf66; font-size: 12px; }
        .status-inactive { color: #868e96; font-size: 12px; }
        @media (max-width: 640px) {
          .searches-grid { gap: 15px; }
          .search-card { padding: 15px; }
          .search-card-actions { flex-direction: column; }
          .btn { width: 100%; }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="container">
          <nav>
            <a href="/">← Back to Jobs</a>
            <a href="/alerts">Alerts</a>
            <a href="/account">Account</a>
            <a href="/saved-jobs">Saved Jobs</a>
          </nav>
        </div>
      </header>

      <main class="container">
        <div class="page-title">
          <h1>Saved Searches</h1>
          <p>Automatically track new jobs matching your saved searches</p>
        </div>

        <div style="margin-bottom: 30px;">
          <a href="/?action=save-search" class="create-btn">+ New Saved Search</a>
        </div>

        ${searches.length > 0 ? html`
          <div class="searches-grid">
            ${searches.map((search) => html`
              <div class="search-card">
                <div class="search-card-header">
                  <div>
                    <div class="search-card-title">${search.name}</div>
                    <div style="color: #666; font-size: 12px; margin-top: 4px;">
                      Created ${new Date(search.created_at).toLocaleDateString()}
                      ${search.is_active === 1 ? html`<span class="status-active">● Active</span>` : html`<span class="status-inactive">● Inactive</span>`}
                    </div>
                  </div>
                  ${(unreadAlertCounts[search.id] || 0) > 0 ? html`
                    <a href="/alerts?search=${search.id}" class="alert-badge">${unreadAlertCounts[search.id]} New</a>
                  ` : ''}
                </div>

                <div class="search-card-filters">
                  ${search.search ? html`<span class="filter-tag">📝 "${search.search}"</span>` : ''}
                  ${search.source ? html`<span class="filter-tag">🔗 ${search.source}</span>` : ''}
                  ${search.location ? html`<span class="filter-tag">📍 ${search.location}</span>` : ''}
                  ${search.employment_type ? html`<span class="filter-tag">💼 ${search.employment_type}</span>` : ''}
                  ${search.category ? html`<span class="filter-tag">🏷️ ${search.category}</span>` : ''}
                  ${search.remote === 1 ? html`<span class="filter-tag">🌐 Remote</span>` : ''}
                </div>

                <div class="search-card-actions">
                  <a href="/?${new URLSearchParams({
                    search: search.search || '',
                    source: search.source || '',
                    location: search.location || '',
                    employment_type: search.employment_type || '',
                    category: search.category || '',
                    remote: search.remote === 1 ? 'true' : '',
                  }).toString()}" class="btn btn-primary">View Results</a>
                  <a href="/saved-searches/${search.id}/edit" class="btn">Edit</a>
                  <button onclick="deleteSearch(${search.id})" class="btn btn-danger">Delete</button>
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="empty-state">
            <h2>No saved searches yet</h2>
            <p>Create a saved search to automatically track new jobs matching your criteria</p>
            <a href="/?action=save-search" class="create-btn">Create Your First Search</a>
          </div>
        `}
      </main>

      <script>
        function deleteSearch(id) {
          if (!confirm('Delete this saved search?')) return;
          fetch(\`/api/saved-searches/\${id}\`, { method: 'DELETE' })
            .then(r => r.ok ? location.reload() : alert('Failed to delete'))
            .catch(e => alert('Error: ' + e.message));
        }
      </script>
    </body>
    </html>
  `;
};
