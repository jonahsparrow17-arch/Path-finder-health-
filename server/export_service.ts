/**
 * PathFinder Health - Export Service
 * Generates sanitized screening and care-navigation export documents.
 * Strictly excludes access tokens, secrets, and private configuration hashes.
 */

import type { SessionRow } from './db.js';

export interface ExportDocument {
  export_id: string;
  generated_at_utc: string;
  session_id: string;
  language: string;
  status: string;
  classification: string | null;
  risk_level: string;
  evidence_coverage_percentage: number;
  intake_summary: any;
  explanation_drivers: any[];
  care_navigation: any;
  mandatory_safety_disclaimer: string;
}

export function generateExportDocument(session: SessionRow): ExportDocument {
  let parsedIntake = null;
  let parsedDrivers = [];
  let parsedNav = null;

  try {
    if (session.intake_data) parsedIntake = JSON.parse(session.intake_data);
  } catch (_) {}

  try {
    if (session.drivers) parsedDrivers = JSON.parse(session.drivers);
  } catch (_) {}

  try {
    if (session.recommendations) parsedNav = JSON.parse(session.recommendations);
  } catch (_) {}

  return {
    export_id: `EXP-${session.session_id.slice(0, 8).toUpperCase()}-${Date.now()}`,
    generated_at_utc: new Date().toISOString(),
    session_id: session.session_id,
    language: session.language,
    status: session.status,
    classification: session.classification,
    risk_level: session.risk_level,
    evidence_coverage_percentage: Math.round((session.evidence_coverage || 0) * 100),
    intake_summary: parsedIntake,
    explanation_drivers: parsedDrivers,
    care_navigation: parsedNav,
    mandatory_safety_disclaimer:
      'This is a health screening and care-navigation summary, not a medical diagnosis. It does not replace clinical evaluation by a qualified healthcare professional. If you experience an emergency, contact emergency medical services immediately.',
  };
}
