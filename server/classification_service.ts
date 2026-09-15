/**
 * PathFinder Health - Deterministic Classification Engine
 * Pure mathematical mapping from EvidenceVector to ClassificationType.
 * Properties:
 * - Deterministic: same input -> same output
 * - No randomness
 * - No hidden state
 * - No LLM override
 * - No disease diagnosis
 */

import type { EvidenceVector, ClassificationType } from './types.js';

export function classify(evidence: EvidenceVector): ClassificationType {
  // Check minimum coverage requirement
  if (evidence.overall_coverage < 0.25) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  const { physical_symptoms_count, mental_symptoms_count, physical_score, mental_score } = evidence;

  if (physical_symptoms_count === 0 && mental_symptoms_count === 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  const hasPhysical = physical_symptoms_count > 0 && physical_score >= 0.5;
  const hasMental = mental_symptoms_count > 0 && mental_score >= 0.5;

  if (hasPhysical && hasMental) {
    return 'OVERLAPPING';
  }

  if (hasPhysical && !hasMental) {
    return 'PHYSICAL';
  }

  if (hasMental && !hasPhysical) {
    return 'MENTAL';
  }

  return 'INSUFFICIENT_EVIDENCE';
}
