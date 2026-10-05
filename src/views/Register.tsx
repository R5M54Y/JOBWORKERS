// JOBWORKERS Register Page
// Server-rendered registration form

import { html } from 'hono/html';
import { Layout } from './Layout';

interface RegisterViewProps {
  error?: string;
}

export const RegisterView = ({ error }: RegisterViewProps) => {
  return Layout({
    title: 'Register',
    children: html`
      <div class="auth-container">
        <div class="auth-card">
          <h1>Create Account</h1>
          
          ${error ? html`
            <div class="error-message">
              ${error}
            </div>
          ` : ''}
          
          <form method="POST" action="/register" class="auth-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                autocomplete="email"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                autocomplete="new-password"
                minlength="8"
                class="form-input"
              />
              <small class="form-hint">Minimum 8 characters</small>
            </div>
            
            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                name="confirm-password" 
                required 
                autocomplete="new-password"
                minlength="8"
                class="form-input"
              />
            </div>
            
            <button type="submit" class="auth-button">Create Account</button>
          </form>
          
          <div class="auth-footer">
            Already have an account? <a href="/login">Login here</a>
          </div>
        </div>
      </div>
      
      <style>
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }
        
        .auth-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }
        
        .auth-card h1 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-group label {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .form-input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #2563eb;
        }
        
        .form-hint {
          font-size: 0.75rem;
          color: #666;
        }
        
        .auth-button {
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        
        .auth-button:hover {
          background: #1d4ed8;
        }
        
        .auth-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: #666;
        }
        
        .auth-footer a {
          color: #2563eb;
          text-decoration: none;
        }
        
        .auth-footer a:hover {
          text-decoration: underline;
        }
        
        .error-message {
          background: #fee;
          color: #c00;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
      </style>
    `,
  });
};
