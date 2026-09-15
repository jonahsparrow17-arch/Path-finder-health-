/**
 * PathFinder Health - Evidence Vector Service
 * Computes structured evidence scores and evidence coverage.
 * Rule: Never phrase or present coverage as disease probability, likelihood, or AI confidence.
 */

import type { IntakeData, EvidenceVector } from './types.js';

export function computeEvidenceVector(intake: IntakeData): EvidenceVector {
  const physicalSymptoms = intake.physical_symptoms || [];
  const mentalSymptoms = intake.mental_symptoms || [];

  const physicalCount = physicalSymptoms.length;
  const mentalCount = mentalSymptoms.length;

  // Weights for symptoms based on specified severity and impact
  let multiplier = 1.0;
  if (intake.severity === 'mild') multiplier *= 0.8;
  if (intake.severity === 'moderate') multiplier *= 1.0;
  if (intake.severity === 'severe') multiplier *= 1.3;

  if (intake.impact === 'mild') multiplier *= 0.9;
  if (intake.impact === 'moderate') multiplier *= 1.1;
  if (intake.impact === 'severe_disruption') multiplier *= 1.3;

  if (intake.duration === '1_to_4_weeks') multiplier *= 1.1;
  if (intake.duration === '1_to_6_months') multiplier *= 1.2;
  if (intake.duration === 'more_than_6_months') multiplier *= 1.3;

  const physicalScore = Number((physicalCount * multiplier).toFixed(2));
  const mentalScore = Number((mentalCount * multiplier).toFixed(2));

  // Coverage calculation: 4 primary dimensions
  const hasSymptoms = physicalCount > 0 || mentalCount > 0;
  const hasDuration = intake.duration !== null && intake.duration !== undefined;
  const hasSeverity = intake.severity !== null && intake.severity !== undefined;
  const hasImpact = intake.impact !== null && intake.impact !== undefined;
  const hasFreeText = typeof intake.free_text === 'string' && intake.free_text.trim().length > 0;

  let dimensionPoints = 0;
  if (hasSymptoms) dimensionPoints += 0.4;
  if (hasDuration) dimensionPoints += 0.2;
  if (hasSeverity) dimensionPoints += 0.2;
  if (hasImpact) dimensionPoints += 0.2;

  const overallCoverage = Number(Math.min(1.0, Math.max(0.0, dimensionPoints)).toFixed(2));
  const totalSymptoms = physicalCount + mentalCount;
  const physicalCoverage = totalSymptoms > 0 ? Number((physicalCount / totalSymptoms).toFixed(2)) : 0.0;
  const mentalCoverage = totalSymptoms > 0 ? Number((mentalCount / totalSymptoms).toFixed(2)) : 0.0;

  return {
    physical_symptoms_count: physicalCount,
    mental_symptoms_count: mentalCount,
    physical_score: physicalScore,
    mental_score: mentalScore,
    physical_coverage: physicalCoverage,
    mental_coverage: mentalCoverage,
    overall_coverage: overallCoverage,
    dimensions_provided: {
      symptoms: hasSymptoms,
      duration: hasDuration,
      severity: hasSeverity,
      impact: hasImpact,
      free_text: hasFreeText,
    },
  };
}
