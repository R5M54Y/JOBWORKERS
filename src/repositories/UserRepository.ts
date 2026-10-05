// JOBWORKERS User Repository
// Database operations for users

import type { User, SafeUser, RegisterInput } from '../types/auth';

export class UserRepository {
  constructor(private db: D1Database) {}

  async createUser(input: RegisterInput & { password_hash: string }): Promise<User> {
    const email = input.email.toLowerCase().trim();
    
    const stmt = this.db.prepare(
      `INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING *`
    ).bind(email, input.password_hash);

    const result = await stmt.first<User>();
    if (!result) throw new Error('Failed to create user');
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
}
