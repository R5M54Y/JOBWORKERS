// JOBWORKERS Authentication Middleware
// Session validation and user context

import { Context, Next } from 'hono';
import { AuthService } from '../services/AuthService';
import type { SafeUser } from '../types/auth';

const SESSION_COOKIE_NAME = 'jobworkers_session';

export interface AuthEnv {
  DB: D1Database;
  ADMIN_SECRET: string;
}

// Extend Hono context with authenticated user
declare module 'hono' {
  interface ContextVariableMap {
    user?: SafeUser;
  }
}

// Middleware: parse session cookie and attach user to context
export async function authMiddleware(c: Context<{ Bindings: AuthEnv }>, next: Next) {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  
  if (sessionToken) {
    try {
      const authService = new AuthService(c.env.DB);
      const user = await authService.validateSession(sessionToken);
      if (user) {
        c.set('user', user);
      }
    } catch (error) {
      // Invalid session, continue without user
      console.error('Session validation error:', error);
    }
  }
  
  await next();
}

// Middleware: require authentication
export async function requireAuth(c: Context<{ Bindings: AuthEnv }>, next: Next) {
  const user = c.get('user');
  
  if (!user) {
    return c.redirect('/login');
  }
  
  await next();
}

// Helper: get cookie value
export function getCookie(c: Context, name: string): string | undefined {
  const cookies = c.req.header('cookie');
  if (!cookies) return undefined;
  
  const parts = cookies.split(';');
  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return undefined;
}

// Helper: set session cookie
export function setSessionCookie(c: Context, token: string): void {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const secure = c.req.url.startsWith('https://') ? 'Secure; ' : '';
  
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ` +
    `Path=/; ` +
    `HttpOnly; ` +
    `${secure}` +
    `SameSite=Lax; ` +
    `Max-Age=${maxAge}`
  );
}

// Helper: clear session cookie
export function clearSessionCookie(c: Context): void {
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; ` +
    `Path=/; ` +
    `HttpOnly; ` +
    `SameSite=Lax; ` +
    `Max-Age=0`
  );
}
