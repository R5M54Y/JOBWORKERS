// JOBWORKERS Authentication Routes
// User registration, login, logout, and current user

import { Context } from 'hono';
import { AuthService } from '../services/AuthService';
import { setSessionCookie, clearSessionCookie, getCookie } from '../middleware/auth';
import type { RegisterInput, LoginInput } from '../types/auth';

const SESSION_COOKIE_NAME = 'jobworkers_session';

// POST /auth/register
export async function handleRegister(c: Context) {
  try {
    const body = await c.req.json<RegisterInput>();
    
    const authService = new AuthService(c.env.DB);
    const { user, token } = await authService.register(body);
    
    setSessionCookie(c, token);
    
    return c.json({ user }, 201);
  } catch (error) {
    const err = error as Error;
    
    if (err.message.includes('already registered')) {
      return c.json({ error: 'Email already registered' }, 409);
    }
    
    if (err.message.includes('Invalid email') || err.message.includes('Password must')) {
      return c.json({ error: err.message }, 400);
    }
    
    console.error('Registration error:', err);
    return c.json({ error: 'Registration failed' }, 500);
  }
}

// POST /auth/login
export async function handleLogin(c: Context) {
  try {
    const body = await c.req.json<LoginInput>();
    
    const authService = new AuthService(c.env.DB);
    const { user, token } = await authService.login(body);
    
    setSessionCookie(c, token);
    
    return c.json({ user });
  } catch (error) {
    const err = error as Error;
    
    // Generic error to prevent account enumeration
    return c.json({ error: 'Invalid email or password' }, 401);
  }
}

// POST /auth/logout
export async function handleLogout(c: Context) {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    
    if (sessionToken) {
      const authService = new AuthService(c.env.DB);
      await authService.logout(sessionToken);
    }
    
    clearSessionCookie(c);
    
    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookie even if logout fails
    clearSessionCookie(c);
    return c.json({ message: 'Logged out' });
  }
}

// GET /auth/me
export async function handleMe(c: Context) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  return c.json({ user });
}
