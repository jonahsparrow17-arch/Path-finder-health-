/**
 * PathFinder Health - Express API Router
 * Endpoints for health, session management, intake validation, assessment scoring, and export.
 */

import { Router, type Request, type Response } from 'express';
import { loadAndValidateConfig } from './config.js';
import { isValidUUIDv4 } from './security.js';
import {
  createSession,
  authenticateSession,
  getSessionSafe,
  saveAssessmentResult,
  deleteSessionById,
} from './session_service.js';
import { evaluateSafety } from './safety_service.js';
import { computeEvidenceVector } from './evidence_service.js';
import { classify } from './classification_service.js';
import { evaluateRisk } from './risk_service.js';
import { generateDrivers } from './explainability_service.js';
import { getNavigationPathway } from './navigation_service.js';
import { checkScreeningReadiness } from './screening_service.js';
import { extractCandidateEvidenceWithAI } from './ai_assistance_service.js';
import { generateExportDocument } from './export_service.js';
import {
  checkIdempotency,
  completeIdempotency,
  hashRequestBody,
} from './idempotency_service.js';
import type { IntakeData, AssessmentResult } from './types.js';

export const apiRouter = Router();

// Helper to extract bearer token
function getBearerToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// 1. Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  const config = loadAndValidateConfig();
  res.json({
    status: 'ok',
    environment: config.environment,
    service: 'PathFinder Health API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    safety_rules_count: config.redFlagsConfig.rules.length,
    safety_config_version: config.redFlagsConfig.version,
  });
});

// 2. Screening Readiness Status
apiRouter.get('/screening/status', (req: Request, res: Response) => {
  const readiness = checkScreeningReadiness();
  res.json(readiness);
});

// 3. Demo Scenarios
apiRouter.get('/demo/scenarios', (req: Request, res: Response) => {
  const config = loadAndValidateConfig();
  res.json({
    scenarios: config.demoScenarios,
    disclaimer: 'DEMO MODE — All scenarios use fictional data for demonstration purposes.',
  });
});

// 4. Session Creation
apiRouter.post('/sessions', (req: Request, res: Response) => {
  const language = (req.body && req.body.language) || 'en';
  const session = createSession(language);
  res.status(201).json(session);
});

// 5. Intake & Candidate Extraction
apiRouter.post('/intake', async (req: Request, res: Response) => {
  const body = req.body || {};
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  const sessionId = req.headers['x-session-id'] as string | undefined;
  const scope = sessionId || req.ip || 'anonymous';
  const reqHash = hashRequestBody(body);

  const idempCheck = checkIdempotency(idempotencyKey, scope, reqHash);
  if (!idempCheck.allowed) {
    if (idempCheck.cachedResponse) {
      return res.status(idempCheck.cachedResponse.status).json(idempCheck.cachedResponse.body);
    }
    if (idempCheck.conflictError) {
      return res.status(idempCheck.conflictError.status).json(idempCheck.conflictError);
    }
  }

  // Validate free_text length
  if (body.free_text && typeof body.free_text === 'string' && body.free_text.length > 2000) {
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: 'free_text exceeds maximum allowed length of 2000 characters.',
    });
  }

  const freeText = typeof body.free_text === 'string' ? body.free_text : '';

  // Optional AI/NLP assistance (candidate evidence extraction)
  const aiResult = await extractCandidateEvidenceWithAI(freeText);

  // Normalize input structure
  const intake: IntakeData = {
    physical_symptoms: Array.isArray(body.physical_symptoms)
      ? body.physical_symptoms
      : aiResult.candidate_physical_symptoms,
    mental_symptoms: Array.isArray(body.mental_symptoms)
      ? body.mental_symptoms
      : aiResult.candidate_mental_symptoms,
    duration: body.duration || null,
    severity: body.severity || null,
    impact: body.impact || null,
    free_text: freeText || null,
  };

  // Immediate Safety Pre-check
  const safetyCheck = evaluateSafety(intake);

  const responseBody = {
    intake,
    candidate_ai_extraction: aiResult,
    safety_check: safetyCheck,
    is_urgent: safetyCheck.is_urgent,
  };

  completeIdempotency(idempotencyKey, scope, 200, responseBody);
  res.json(responseBody);
});

// 6. Score & Assessment
apiRouter.post('/score', (req: Request, res: Response) => {
  const body = req.body || {};
  const sessionId = body.session_id || (req.headers['x-session-id'] as string);
  const token = getBearerToken(req) || (body.session_token as string);

  // Validate session ID
  if (!sessionId || !isValidUUIDv4(sessionId)) {
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: 'Valid session_id (UUIDv4) is required.',
    });
  }

  // Authenticate session if token provided
  if (token) {
    const sessionRow = authenticateSession(sessionId, token);
    if (!sessionRow) {
      return res.status(403).json({
        error_code: 'AUTHORIZATION_ERROR',
        message: 'Invalid or expired session access token.',
      });
    }
  }

  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  const scope = sessionId;
  const reqHash = hashRequestBody(body);

  const idempCheck = checkIdempotency(idempotencyKey, scope, reqHash);
  if (!idempCheck.allowed) {
    if (idempCheck.cachedResponse) {
      return res.status(idempCheck.cachedResponse.status).json(idempCheck.cachedResponse.body);
    }
    if (idempCheck.conflictError) {
      return res.status(idempCheck.conflictError.status).json(idempCheck.conflictError);
    }
  }

  const intake: IntakeData = {
    physical_symptoms: Array.isArray(body.intake?.physical_symptoms) ? body.intake.physical_symptoms : [],
    mental_symptoms: Array.isArray(body.intake?.mental_symptoms) ? body.intake.mental_symptoms : [],
    duration: body.intake?.duration || null,
    severity: body.intake?.severity || null,
    impact: body.intake?.impact || null,
    free_text: body.intake?.free_text || null,
  };

  const config = loadAndValidateConfig();

  // 1. Authoritative Safety Gate
  const safetyCheck = evaluateSafety(intake);

  if (safetyCheck.status === 'BLOCKED') {
    const blockedResponse = {
      status: 'BLOCKED',
      result_available: false,
      classification: null,
      risk_level: null,
      safety_status: 'BLOCKED',
      error_code: safetyCheck.error_code || 'SAFETY_CONFIGURATION_BLOCKED',
      message_key: safetyCheck.message_key || 'safe_configuration_unavailable',
      request_id: `REQ-${Date.now()}`,
    };
    completeIdempotency(idempotencyKey, scope, 503, blockedResponse);
    return res.status(503).json(blockedResponse);
  }

  const screeningReadiness = checkScreeningReadiness();

  // 2. Urgent Branch (Precedence rule)
  if (safetyCheck.is_urgent) {
    const urgentResult: AssessmentResult = {
      session_id: sessionId,
      status: 'URGENT',
      classification: null, // Urgent has no normal classification
      risk_level: 'URGENT',
      safety_status: 'TRIGGERED',
      evidence_coverage: 1.0,
      drivers: generateDrivers(null, 'URGENT', {
        physical_symptoms_count: intake.physical_symptoms.length,
        mental_symptoms_count: intake.mental_symptoms.length,
        physical_score: 0,
        mental_score: 0,
        physical_coverage: 0,
        mental_coverage: 0,
        overall_coverage: 1.0,
        dimensions_provided: { symptoms: true, duration: true, severity: true, impact: true, free_text: true }
      }, intake, safetyCheck.urgent_reasons),
      navigation: getNavigationPathway(null, true),
      emergency_contacts: config.emergencyConfig.contacts.filter((c) => c.verification_status === 'VERIFIED'),
      screening_status: screeningReadiness,
      safety_config_version: safetyCheck.safety_config_version,
      safety_config_hash: safetyCheck.safety_config_hash,
      created_at: new Date().toISOString(),
    };

    saveAssessmentResult(sessionId, intake, urgentResult);
    completeIdempotency(idempotencyKey, scope, 200, urgentResult);
    return res.json(urgentResult);
  }

  // 3. Normal Deterministic Branch
  const evidence = computeEvidenceVector(intake);
  const classification = classify(evidence);
  const risk = evaluateRisk(intake, false);
  const drivers = generateDrivers(classification, risk, evidence, intake);
  const navigation = getNavigationPathway(classification, false);

  const completedResult: AssessmentResult = {
    session_id: sessionId,
    status: 'COMPLETED',
    classification,
    risk_level: risk,
    safety_status: 'CLEAR',
    evidence_coverage: evidence.overall_coverage,
    drivers,
    navigation,
    screening_status: screeningReadiness,
    safety_config_version: safetyCheck.safety_config_version,
    safety_config_hash: safetyCheck.safety_config_hash,
    created_at: new Date().toISOString(),
  };

  saveAssessmentResult(sessionId, intake, completedResult);
  completeIdempotency(idempotencyKey, scope, 200, completedResult);
  return res.json(completedResult);
});

// 7. Get Session
apiRouter.get('/session/:session_id', (req: Request, res: Response) => {
  const sessionId = req.params.session_id;
  if (!isValidUUIDv4(sessionId)) {
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: 'Invalid session UUID format.',
    });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({
      error_code: 'AUTHORIZATION_ERROR',
      message: 'Session authorization token required in Authorization header.',
    });
  }

  const authenticated = authenticateSession(sessionId, token);
  if (!authenticated) {
    return res.status(403).json({
      error_code: 'AUTHORIZATION_ERROR',
      message: 'Access denied: invalid or mismatched session token.',
    });
  }

  const safeSession = getSessionSafe(sessionId);
  if (!safeSession) {
    return res.status(404).json({
      error_code: 'NOT_FOUND',
      message: 'Session not found.',
    });
  }

  res.json(safeSession);
});

// 8. Delete Session (Privacy Right to Erasure)
apiRouter.delete('/session/:session_id', (req: Request, res: Response) => {
  const sessionId = req.params.session_id;
  if (!isValidUUIDv4(sessionId)) {
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: 'Invalid session UUID format.',
    });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({
      error_code: 'AUTHORIZATION_ERROR',
      message: 'Session authorization token required in Authorization header.',
    });
  }

  const authenticated = authenticateSession(sessionId, token);
  if (!authenticated) {
    return res.status(403).json({
      error_code: 'AUTHORIZATION_ERROR',
      message: 'Access denied: invalid or mismatched session token.',
    });
  }

  deleteSessionById(sessionId);
  res.json({
    status: 'deleted',
    session_id: sessionId,
    message: 'Session and associated intake data permanently removed.',
  });
});

// 9. Export Session Summary
apiRouter.get('/export/:session_id', (req: Request, res: Response) => {
  const sessionId = req.params.session_id;
  if (!isValidUUIDv4(sessionId)) {
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: 'Invalid session UUID format.',
    });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({
      error_code: 'AUTHORIZATION_ERROR',
      message: 'Session authorization token required in Authorization header.',
    });
  }

  const authenticated = authenticateSession(sessionId, token);
  if (!authenticated) {
    return res.status(403).json({
      error_code: 'AUTHORIZATION_ERROR',
      message: 'Access denied: invalid or mismatched session token.',
    });
  }

  const exportDoc = generateExportDocument(authenticated);
  res.json(exportDoc);
});
