/**
 * PathFinder Health - Session Security & Persistence Service
 * Generates and verifies cryptographically secure sessions.
 * Never stores or exports raw access tokens.
 */

import { getDatabase, type SessionRow } from './db.js';
import {
  generateSessionId,
  generateSessionToken,
  hashSessionToken,
  timingSafeEqual,
  isValidUUIDv4,
} from './security.js';
import { loadAndValidateConfig } from './config.js';
import type { IntakeData, AssessmentResult } from './types.js';

export interface CreateSessionResult {
  session_id: string;
  session_token: string;
  created_at: string;
}

export function createSession(language: string = 'en'): CreateSessionResult {
  const db = getDatabase();
  const config = loadAndValidateConfig();

  const sessionId = generateSessionId();
  const rawToken = generateSessionToken();
  const tokenVerifier = hashSessionToken(rawToken, config.sessionTokenSecret);
  const now = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO sessions (
      session_id, token_verifier, created_at, updated_at, language, status,
      safety_config_version, safety_config_hash, schema_version
    ) VALUES (?, ?, ?, ?, ?, 'CREATED', ?, ?, '1.0')
  `);

  insertStmt.run(
    sessionId,
    tokenVerifier,
    now,
    now,
    language || 'en',
    config.redFlagsConfig.version,
    config.redFlagsHash
  );

  return {
    session_id: sessionId,
    session_token: rawToken,
    created_at: now,
  };
}

export function authenticateSession(sessionId: string, rawToken: string): SessionRow | null {
  if (!isValidUUIDv4(sessionId) || !rawToken) {
    return null;
  }

  const db = getDatabase();
  const config = loadAndValidateConfig();
  const expectedVerifier = hashSessionToken(rawToken, config.sessionTokenSecret);

  const row = (db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId) as unknown) as SessionRow | undefined;
  if (!row) {
    return null;
  }

  if (!timingSafeEqual(row.token_verifier, expectedVerifier)) {
    return null;
  }

  return row;
}

export function getSessionSafe(sessionId: string): Partial<SessionRow> | null {
  if (!isValidUUIDv4(sessionId)) {
    return null;
  }

  const db = getDatabase();
  const row = (db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId) as unknown) as SessionRow | undefined;
  if (!row) {
    return null;
  }

  // Strip token_verifier
  const { token_verifier, ...safeSession } = row;
  return safeSession;
}

export function saveAssessmentResult(
  sessionId: string,
  intake: IntakeData,
  result: AssessmentResult
): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updateStmt = db.prepare(`
    UPDATE sessions SET
      updated_at = ?,
      status = ?,
      intake_data = ?,
      classification = ?,
      risk_level = ?,
      evidence_coverage = ?,
      drivers = ?,
      recommendations = ?,
      safety_config_version = ?,
      safety_config_hash = ?
    WHERE session_id = ?
  `);

  updateStmt.run(
    now,
    result.status,
    JSON.stringify(intake),
    result.classification,
    result.risk_level,
    result.evidence_coverage,
    JSON.stringify(result.drivers),
    JSON.stringify(result.navigation),
    result.safety_config_version,
    result.safety_config_hash,
    sessionId
  );
}

export function deleteSessionById(sessionId: string): boolean {
  if (!isValidUUIDv4(sessionId)) return false;
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM sessions WHERE session_id = ?');
  stmt.run(sessionId);
  return true;
}
