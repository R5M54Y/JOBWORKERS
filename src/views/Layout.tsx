// JOBWORKERS Frontend Layout
// Bootstrap 5 based professional layout

import type { BrandingConfig } from '../config/branding';

interface LayoutProps {
  title: string;
  children: any;
  user?: any;
  branding?: BrandingConfig;
}

export const Layout = ({ title, children, user, branding }: LayoutProps) => {
  const siteName = branding?.siteName || 'JOBWORKERS';
  const tagline = branding?.tagline || 'Remote job opportunities';
  const copyright = branding?.copyright || `© 2026 ${siteName}. Remote job opportunities aggregated from top sources.`;
  
  return (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="google-site-verification" content="zEgd8iW1JqgWv7knYKK_EgkhdK4bwDpBRPIT5kkdYZg" />
      <title>{title} - {siteName}</title>
      
      {/* Bootstrap 5 CSS */}
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous" />
      
      {/* Bootstrap Icons */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
      
      {/* Custom styles */}
      <style>{`
        :root {
          --primary-color: #0d6efd;
          --primary-dark: #0b5ed7;
          --text-dark: #212529;
          --text-muted: #6c757d;
          --border-color: #dee2e6;
          --bg-light: #f8f9fa;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: var(--bg-light);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .navbar {
          background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        
        .navbar-brand {
          font-weight: 700;
          font-size: 1.5rem;
          letter-spacing: -0.5px;
        }
        
        .navbar-text-small {
          font-size: 0.875rem;
          opacity: 0.95;
        }
        
        .nav-link {
          font-weight: 500;
          transition: opacity 0.2s;
        }
        
        .nav-link:hover {
          opacity: 0.85;
        }
        
        main {
          flex: 1;
          padding-top: 2rem;
          padding-bottom: 2rem;
        }
        
        .card {
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          transition: box-shadow 0.2s;
        }
        
        .card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        .job-card {
          cursor: pointer;
          margin-bottom: 1rem;
        }
        
        .job-card h5 {
          color: var(--primary-color);
          font-weight: 600;
        }
        
        .badge {
          font-weight: 500;
          padding: 0.35em 0.65em;
        }
        
        .btn {
          font-weight: 500;
          padding: 0.5rem 1.25rem;
        }
        
        .search-section {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          margin-bottom: 2rem;
        }
        
        .job-detail {
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        
        .job-detail-description {
          line-height: 1.8;
          color: #495057;
        }
        
        .job-detail-description h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: var(--text-dark);
        }
        
        .job-detail-description ul,
        .job-detail-description ol {
          padding-left: 1.5rem;
        }
        
        .job-detail-description li {
          margin-bottom: 0.5rem;
        }
        
        .auth-card {
          max-width: 450px;
          margin: 3rem auto;
        }
        
        .form-control:focus,
        .form-select:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
        }
        
        .pagination {
          margin-top: 2rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }
        
        .empty-state i {
          font-size: 4rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        
        footer {
          background: white;
          border-top: 1px solid var(--border-color);
          margin-top: auto;
          padding: 2rem 0;
        }
        
        footer a {
          color: var(--primary-color);
          text-decoration: none;
        }
        
        footer a:hover {
          text-decoration: underline;
        }
        
        .text-primary-custom {
          color: var(--primary-color) !important;
        }
        
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .navbar-brand {
            font-size: 1.25rem;
          }
          
          main {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
          }
          
          .search-section,
          .job-detail,
          .auth-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </head>
    <body>
      {/* Navigation */}
      <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
          <a class="navbar-brand d-flex flex-column" href="/">
            <span>{siteName}</span>
            <small class="navbar-text-small">{tagline}</small>
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item">
                <a class="nav-link" href="/">
                  <i class="bi bi-briefcase me-1"></i>Jobs
                </a>
              </li>
              
              {user ? (
                <>
                  <li class="nav-item">
                    <a class="nav-link" href="/saved-searches">
                      <i class="bi bi-search me-1"></i>Saved Searches
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/alerts">
                      <i class="bi bi-bell me-1"></i>Alerts
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/saved-jobs">
                      <i class="bi bi-bookmark me-1"></i>Saved Jobs
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/applications">
                      <i class="bi bi-file-text me-1"></i>Applications
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/account">
                      <i class="bi bi-person-circle me-1"></i>Account
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li class="nav-item">
                    <a class="nav-link" href="/login">
                      <i class="bi bi-box-arrow-in-right me-1"></i>Login
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/register">
                      <i class="bi bi-person-plus me-1"></i>Register
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main class="container">
        {children}
      </main>
      
      {/* Footer */}
      <footer class="bg-white border-top">
        <div class="container">
          <div class="row">
            <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <p class="mb-0 text-muted small">
                {copyright}
              </p>
            </div>
            <div class="col-md-6 text-center text-md-end">
              <a href="/privacy-policy" class="me-3 small"><i class="bi bi-shield-lock me-1"></i>Privacy Policy</a>
              <a href="/sitemap.xml" class="me-3 small"><i class="bi bi-diagram-3 me-1"></i>Sitemap</a>
              <a href="/robots.txt" class="small"><i class="bi bi-robot me-1"></i>Robots.txt</a>
            </div>
          </div>
        </div>
      </footer>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
      
      {/* Third-party tracking scripts */}
      <script src="https://pl31517511.profitableratecpmnetwork.com/0a/6f/45/0a6f45f6cd118b7b19498f9076f1a08f.js"></script>
      
      {/* Histats.com START (async) */}
      <script type="text/javascript" dangerouslySetInnerHTML={{__html: `
        var _Hasync = _Hasync || [];
        _Hasync.push(['Histats.start', '1,5052094,4,511,95,18,00000000']);
        _Hasync.push(['Histats.fasi', '1']);
        _Hasync.push(['Histats.track_hits', '']);
        (function() {
          var hs = document.createElement('script'); 
          hs.type = 'text/javascript'; 
          hs.async = true;
          hs.src = ('//s10.histats.com/js15_as.js');
          (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
        })();
      `}}></script>
      <noscript><a href="/" target="_blank"><img src="//sstatic1.histats.com/0.gif?5052094&amp;101" alt="" border="0" /></a></noscript>
      {/* Histats.com END */}
    </body>
  </html>
  );
};
