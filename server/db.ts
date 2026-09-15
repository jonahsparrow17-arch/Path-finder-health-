import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

let dbInstance: DatabaseSync | null = null;

export interface SessionRow {
  session_id: string;
  token_verifier: string;
  created_at: string;
  updated_at: string;
  language: string;
  status: string;
  intake_data: string | null;
  screening_data: string | null;
  classification: string | null;
  risk_level: string;
  evidence_coverage: number;
  drivers: string | null;
  recommendations: string | null;
  safety_config_version: string;
  safety_config_hash: string;
  schema_version: string;
}

export interface IdempotencyRow {
  id: number;
  scoped_key: string;
  session_id: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  request_hash: string;
  response_body: string | null;
  response_status: number | null;
  created_at: number;
}

export function initDatabase(dbPath?: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const targetPath = dbPath || process.env.DB_PATH || path.join(process.cwd(), 'pathfinder.db');
  
  // Ensure directory exists if not in-memory
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new DatabaseSync(targetPath);

  // Enable WAL mode for better concurrency and performance
  try {
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    // In-memory or fallback
  }

  // Create tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      token_verifier TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      status TEXT NOT NULL DEFAULT 'CREATED',
      intake_data TEXT,
      screening_data TEXT,
      classification TEXT,
      risk_level TEXT NOT NULL DEFAULT 'LOW',
      evidence_coverage REAL NOT NULL DEFAULT 0.0,
      drivers TEXT,
      recommendations TEXT,
      safety_config_version TEXT NOT NULL,
      safety_config_hash TEXT NOT NULL,
      schema_version TEXT NOT NULL DEFAULT '1.0'
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scoped_key TEXT UNIQUE NOT NULL,
      session_id TEXT,
      status TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      response_body TEXT,
      response_status INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_idempotency_scoped ON idempotency_keys(scoped_key);
  `);

  return dbInstance;
}

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (_) {}
    dbInstance = null;
  }
}
