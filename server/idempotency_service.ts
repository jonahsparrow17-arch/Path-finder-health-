/**
 * PathFinder Health - Idempotency Service
 * Guarantees safe mutation retries using Idempotency-Key headers.
 * Rule: Database uniqueness enforces effective_scope + idempotency_key atomically.
 */

import crypto from 'node:crypto';
import { getDatabase, type IdempotencyRow } from './db.js';

export interface IdempotencyCheckResult {
  allowed: boolean;
  cachedResponse?: {
    status: number;
    body: any;
  };
  conflictError?: {
    status: number;
    error_code: string;
    message: string;
  };
}

export function hashRequestBody(body: any): string {
  const serialized = JSON.stringify(body || {});
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export function checkIdempotency(
  idempotencyKey: string | undefined,
  scope: string,
  requestHash: string
): IdempotencyCheckResult {
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return { allowed: true }; // No key provided, normal execution
  }

  const sanitizedKey = idempotencyKey.trim();
  if (sanitizedKey.length < 8 || sanitizedKey.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(sanitizedKey)) {
    return {
      allowed: false,
      conflictError: {
        status: 400,
        error_code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency key must be 8-128 alphanumeric characters, dashes, or underscores.',
      },
    };
  }

  const scopedKey = `${scope}:${sanitizedKey}`;
  const db = getDatabase();

  const existing = (db.prepare('SELECT * FROM idempotency_keys WHERE scoped_key = ?').get(scopedKey) as unknown) as IdempotencyRow | undefined;

  if (!existing) {
    // Reserve atomically
    try {
      db.prepare(`
        INSERT INTO idempotency_keys (scoped_key, session_id, status, request_hash, created_at)
        VALUES (?, ?, 'IN_PROGRESS', ?, ?)
      `).run(scopedKey, scope, requestHash, Date.now());
      return { allowed: true };
    } catch (err: any) {
      // Race condition lock
      return {
        allowed: false,
        conflictError: {
          status: 409,
          error_code: 'MUTATION_IN_PROGRESS',
          message: 'An identical operation is currently in progress.',
        },
      };
    }
  }

  // Conflict if payload hash differs
  if (existing.request_hash !== requestHash) {
    return {
      allowed: false,
      conflictError: {
        status: 409,
        error_code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
        message: 'Idempotency key reused with conflicting request payload.',
      },
    };
  }

  if (existing.status === 'IN_PROGRESS') {
    return {
      allowed: false,
      conflictError: {
        status: 409,
        error_code: 'MUTATION_IN_PROGRESS',
        message: 'The requested operation is already processing. Please wait.',
      },
    };
  }

  if (existing.status === 'COMPLETED' && existing.response_body) {
    try {
      const parsedBody = JSON.parse(existing.response_body);
      return {
        allowed: false,
        cachedResponse: {
          status: existing.response_status || 200,
          body: parsedBody,
        },
      };
    } catch (_) {}
  }

  return { allowed: true };
}

export function completeIdempotency(
  idempotencyKey: string | undefined,
  scope: string,
  statusCode: number,
  responseBody: any
): void {
  if (!idempotencyKey) return;
  const scopedKey = `${scope}:${idempotencyKey.trim()}`;
  const db = getDatabase();

  try {
    db.prepare(`
      UPDATE idempotency_keys
      SET status = 'COMPLETED', response_status = ?, response_body = ?
      WHERE scoped_key = ?
    `).run(statusCode, JSON.stringify(responseBody), scopedKey);
  } catch (_) {}
}
