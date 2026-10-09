// JOBWORKERS Account Page
// Protected user account page

import { html } from 'hono/html';
import { Layout } from './Layout';
import type { SafeUser } from '../types/auth';

interface AccountViewProps {
  user?: any;
  userFromLayout?: any;
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

export const AccountView = ({ user, userFromLayout }: AccountViewProps) => {
  return Layout({
    title: 'Account',
    user: userFromLayout || user,
    children: html`
      <div class="account-container">
        <div class="account-card">
          <h1>My Account</h1>
          
          <div class="account-info">
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">${user.email}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Account Created</span>
              <span class="info-value">${formatDate(user.created_at)}</span>
            </div>
          </div>
          
          <div class="account-actions">
            <form method="POST" action="/auth/logout">
              <button type="submit" class="logout-button">Logout</button>
            </form>
          </div>
        </div>
      </div>
      
      <style>
        .account-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
        }
        
        .account-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 500px;
        }
        
        .account-card h1 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .account-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .info-label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 1rem;
          color: #111;
        }
        
        .account-actions {
          display: flex;
          gap: 1rem;
        }
        
        .logout-button {
          padding: 0.75rem 2rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }
        
        .logout-button:hover {
          background: #b91c1c;
        }
      </style>
    `,
  });
};
