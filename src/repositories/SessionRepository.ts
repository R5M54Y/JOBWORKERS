// JOBWORKERS Session Repository
// Database operations for sessions

import type { Session } from '../types/auth';

export class SessionRepository {
  constructor(private db: D1Database) {}

  async createSession(userId: number, tokenHash: string, expiresAt: Date): Promise<Session> {
    // Insert session
    const insertStmt = this.db.prepare(
      `INSERT INTO sessions (user_id, token_hash, expires_at) 
       VALUES (?, ?, ?)`
    ).bind(userId, tokenHash, expiresAt.toISOString());

    const insertResult = await insertStmt.run();
    if (!insertResult.success) throw new Error('Failed to create session');
    
    // Fetch the created session
    const selectStmt = this.db.prepare(
      'SELECT * FROM sessions WHERE id = ?'
    ).bind(insertResult.meta.last_row_id);
    
    const result = await selectStmt.first<Session>();
    if (!result) throw new Error('Failed to retrieve created session');
    return result;
  }

  async getSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM sessions WHERE token_hash = ? AND expires_at > datetime("now")'
    ).bind(tokenHash);
    
    return await stmt.first<Session>();
  }

  async deleteSession(tokenHash: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash);
    await stmt.run();
  }

  async updateLastUsed(tokenHash: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE sessions SET last_used_at = datetime('now') WHERE token_hash = ?`
    ).bind(tokenHash);
    await stmt.run();
  }

  async deleteExpiredSessions(): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")');
    await stmt.run();
  }
}
