/**
 * PathFinder Health - Data Retention Service
 * Automatically purges sessions older than the specified retention window (default: 30 days).
 * Uses UTC timestamps.
 */

import { getDatabase } from './db.js';
import { loadAndValidateConfig } from './config.js';

export interface RetentionResult {
  records_deleted: number;
  cutoff_utc: string;
}

export function runRetentionCleanup(
  customRetentionDays?: number,
  referenceDate: Date = new Date()
): RetentionResult {
  const config = loadAndValidateConfig();
  const retentionDays = customRetentionDays ?? config.retentionDays;

  // Calculate UTC cutoff timestamp
  const cutoffTime = new Date(referenceDate.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoffTime.toISOString();

  const db = getDatabase();
  const deleteStmt = db.prepare('DELETE FROM sessions WHERE created_at < ?');
  const info = deleteStmt.run(cutoffIso);

  // Also clean up old idempotency keys older than 24 hours
  const idempCutoff = referenceDate.getTime() - 24 * 60 * 60 * 1000;
  try {
    db.prepare('DELETE FROM idempotency_keys WHERE created_at < ?').run(idempCutoff);
  } catch (_) {}

  return {
    records_deleted: Number(info.changes || 0),
    cutoff_utc: cutoffIso,
  };
}
