/**
 * PathFinder Health - Authoritative Screening Verification Service
 * Evaluates readiness, cryptographic integrity, and authorization of standardized screening instruments.
 * Strict fail-closed rule: If verified official source documents are absent,
 * status is BLOCKED with SCREENING_UNAVAILABLE. Never invent or mock instruments.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ScreeningReadiness } from './types.js';

export function checkScreeningReadiness(): ScreeningReadiness {
  const rootDir = process.cwd();
  const screeningDir = path.join(rootDir, 'shared', 'data', 'screening');

  const phq9Dir = path.join(screeningDir, 'PHQ-9');
  const gad7Dir = path.join(screeningDir, 'GAD-7');

  const phq9Pdf = path.join(phq9Dir, 'phq9_official_source.pdf');
  const phq9Meta = path.join(phq9Dir, 'phq9_metadata.json');

  const gad7Pdf = path.join(gad7Dir, 'gad7_official_source.pdf');
  const gad7Meta = path.join(gad7Dir, 'gad7_metadata.json');

  const phq9Exists = fs.existsSync(phq9Pdf) && fs.existsSync(phq9Meta);
  const gad7Exists = fs.existsSync(gad7Pdf) && fs.existsSync(gad7Meta);

  if (!phq9Exists && !gad7Exists) {
    return {
      status: 'BLOCKED',
      available_instruments: [],
      error_code: 'SCREENING_SOURCE_MISSING',
      error_message_key: 'screening_source_missing_fail_closed',
      verified_at: null,
    };
  }

  // If files exist, verify SHA-256 and metadata
  const verifiedInstruments: string[] = [];

  if (phq9Exists) {
    try {
      const meta = JSON.parse(fs.readFileSync(phq9Meta, 'utf-8'));
      const pdfContent = fs.readFileSync(phq9Pdf);
      const computedHash = crypto.createHash('sha256').update(pdfContent).digest('hex');

      if (meta.source_sha256 && meta.source_sha256.toLowerCase() === computedHash.toLowerCase()) {
        if (meta.authorization_status === 'VERIFIED') {
          verifiedInstruments.push('PHQ-9');
        }
      }
    } catch (_) {}
  }

  if (gad7Exists) {
    try {
      const meta = JSON.parse(fs.readFileSync(gad7Meta, 'utf-8'));
      const pdfContent = fs.readFileSync(gad7Pdf);
      const computedHash = crypto.createHash('sha256').update(pdfContent).digest('hex');

      if (meta.source_sha256 && meta.source_sha256.toLowerCase() === computedHash.toLowerCase()) {
        if (meta.authorization_status === 'VERIFIED') {
          verifiedInstruments.push('GAD-7');
        }
      }
    } catch (_) {}
  }

  if (verifiedInstruments.length === 0) {
    return {
      status: 'BLOCKED',
      available_instruments: [],
      error_code: 'SCREENING_AUTHORIZATION_UNVERIFIED',
      error_message_key: 'screening_authorization_unverified',
      verified_at: null,
    };
  }

  return {
    status: 'READY',
    available_instruments: verifiedInstruments,
    error_code: 'NONE',
    error_message_key: 'screening_ready',
    verified_at: new Date().toISOString(),
  };
}
