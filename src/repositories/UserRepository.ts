// JOBWORKERS User Repository
// Database operations for users

import type { User, SafeUser, RegisterInput } from '../types/auth';

export class UserRepository {
  constructor(private db: D1Database) {}

  async createUser(input: { email: string; password_hash: string }): Promise<User> {
    const email = input.email.toLowerCase().trim();
    
    // Insert user
    const insertStmt = this.db.prepare(
      `INSERT INTO users (email, password_hash) VALUES (?, ?)`
    ).bind(email, input.password_hash);

    const insertResult = await insertStmt.run();
    if (!insertResult.success) throw new Error('Failed to create user');
    
    // Fetch the created user
    const selectStmt = this.db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(insertResult.meta.last_row_id);
    
    const result = await selectStmt.first<User>();
    if (!result) throw new Error('Failed to retrieve created user');
    return result;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail);
    return await stmt.first<User>();
  }

  async getUserById(id: number): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id);
    return await stmt.first<User>();
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  }

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    const stmt = this.db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(passwordHash, id);
    
    await stmt.run();
  }
}
