import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, closeDatabase, getDatabase } from '../server/db.js';
import { loadAndValidateConfig } from '../server/config.js';
import {
  createSession,
  authenticateSession,
  getSessionSafe,
  deleteSessionById,
} from '../server/session_service.js';
import {
  checkIdempotency,
  completeIdempotency,
  hashRequestBody,
} from '../server/idempotency_service.js';
import { runRetentionCleanup } from '../server/retention_service.js';

describe('Session Security, Idempotency & Data Retention', () => {
  beforeAll(() => {
    loadAndValidateConfig();
    initDatabase(':memory:');
  });

  afterAll(() => {
    closeDatabase();
  });

  it('creates cryptographically valid session and denies access without raw token', () => {
    const session = createSession('en');
    expect(session.session_id).toBeDefined();
    expect(session.session_token).toBeDefined();

    // Raw token authenticates successfully
    const authValid = authenticateSession(session.session_id, session.session_token);
    expect(authValid).not.toBeNull();
    expect(authValid?.session_id).toBe(session.session_id);

    // Invalid token fails
    const authInvalid = authenticateSession(session.session_id, 'tampered_invalid_token');
    expect(authInvalid).toBeNull();

    // Sanitized session strips token verifier
    const safeSession = getSessionSafe(session.session_id);
    expect((safeSession as any).token_verifier).toBeUndefined();
  });

  it('enforces idempotency semantics: replay returns cached response, conflict returns 409', () => {
    const key = 'idem-test-key-123456';
    const scope = 'session-test-scope';
    const payloadA = { step: 'intake', symptoms: ['joint_pain'] };
    const payloadB = { step: 'intake', symptoms: ['headache_conflict'] };

    const hashA = hashRequestBody(payloadA);
    const hashB = hashRequestBody(payloadB);

    // 1st request -> allowed
    const check1 = checkIdempotency(key, scope, hashA);
    expect(check1.allowed).toBe(true);

    // Complete the operation
    completeIdempotency(key, scope, 200, { result: 'ok_first' });

    // 2nd identical request -> cached response returned
    const check2 = checkIdempotency(key, scope, hashA);
    expect(check2.allowed).toBe(false);
    expect(check2.cachedResponse?.status).toBe(200);
    expect(check2.cachedResponse?.body.result).toBe('ok_first');

    // Reusing same key with different payload -> conflict 409
    const check3 = checkIdempotency(key, scope, hashB);
    expect(check3.allowed).toBe(false);
    expect(check3.conflictError?.status).toBe(409);
    expect(check3.conflictError?.error_code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
  });

  it('data retention: retains 29-day records, purges 30+ day records', () => {
    const db = getDatabase();
    const now = new Date();

    const date29DaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString();
    const date31DaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();

    // Insert 29-day record
    db.prepare(`
      INSERT INTO sessions (
        session_id, token_verifier, created_at, updated_at, language, status,
        safety_config_version, safety_config_hash, schema_version
      ) VALUES ('sess-29-day-uuid-sample-1234', 'verifier1', ?, ?, 'en', 'COMPLETED', '1.0', 'hash', '1.0')
    `).run(date29DaysAgo, date29DaysAgo);

    // Insert 31-day record
    db.prepare(`
      INSERT INTO sessions (
        session_id, token_verifier, created_at, updated_at, language, status,
        safety_config_version, safety_config_hash, schema_version
      ) VALUES ('sess-31-day-uuid-sample-5678', 'verifier2', ?, ?, 'en', 'COMPLETED', '1.0', 'hash', '1.0')
    `).run(date31DaysAgo, date31DaysAgo);

    // Run retention cleanup with default 30 days
    const cleanupResult = runRetentionCleanup(30, now);
    expect(cleanupResult.records_deleted).toBeGreaterThanOrEqual(1);

    // Verify 29-day record exists
    const rec29 = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get('sess-29-day-uuid-sample-1234');
    expect(rec29).toBeDefined();

    // Verify 31-day record was purged
    const rec31 = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get('sess-31-day-uuid-sample-5678');
    expect(rec31).toBeUndefined();
  });
});
