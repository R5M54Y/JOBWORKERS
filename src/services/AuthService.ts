// JOBWORKERS Authentication Service
// Session management and user authentication using PBKDF2 password hashing

import { UserRepository } from '../repositories/UserRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { PasswordService } from './PasswordService';
import type { RegisterInput, LoginInput, SafeUser } from '../types/auth';

// Session lifetime: 30 days
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthService {
  private userRepo: UserRepository;
  private sessionRepo: SessionRepository;
  private passwordService: PasswordService;

  constructor(db: D1Database) {
    this.userRepo = new UserRepository(db);
    this.sessionRepo = new SessionRepository(db);
    this.passwordService = new PasswordService();
  }

  // Generate cryptographically secure random token
  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    // Validate input
    const email = input.email.toLowerCase().trim();
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }
    if (!input.password || input.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    const existing = await this.userRepo.getUserByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password using PBKDF2
    const password_hash = await this.passwordService.hashPassword(input.password);

    // Create user
    const user = await this.userRepo.createUser({ email, password: input.password, password_hash });

    // Create session
    const token = this.generateToken();
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    
    await this.sessionRepo.createSession(user.id, tokenHash, expiresAt);

    return {
      user: this.userRepo.toSafeUser(user),
      token,
    };
  }

  async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
    const email = input.email.toLowerCase().trim();

    // Generic error to prevent account enumeration
    const invalidError = new Error('Invalid email or password');

    const user = await this.userRepo.getUserByEmail(email);
    if (!user || !user.password_hash) {
      throw invalidError;
    }

    const { valid, needsRehash } = await this.passwordService.verifyPassword(
      input.password,
      user.password_hash
    );
    if (!valid) {
      throw invalidError;
    }

    // Opportunistic rehashing: if legacy hash was valid, rehash with PBKDF2
    if (needsRehash) {
      const newPasswordHash = await this.passwordService.hashPassword(input.password);
      await this.userRepo.updatePasswordHash(user.id, newPasswordHash);
    }

    // Create session
    const token = this.generateToken();
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    
    await this.sessionRepo.createSession(user.id, tokenHash, expiresAt);

    return {
      user: this.userRepo.toSafeUser(user),
      token,
    };
  }

  async logout(token: string): Promise<void> {
    const tokenHash = await this.hashToken(token);
    await this.sessionRepo.deleteSession(tokenHash);
  }

  async validateSession(token: string): Promise<SafeUser | null> {
    const tokenHash = await this.hashToken(token);
    const session = await this.sessionRepo.getSessionByTokenHash(tokenHash);
    
    if (!session) return null;

    const user = await this.userRepo.getUserById(session.user_id);
    if (!user) return null;

    // Update last used
    await this.sessionRepo.updateLastUsed(tokenHash);

    return this.userRepo.toSafeUser(user);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
