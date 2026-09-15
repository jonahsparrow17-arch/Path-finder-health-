/**
 * PathFinder Health - Independent Risk Engine
 * Computes risk level independently from classification.
 * Valid combinations: MENTAL + HIGH, PHYSICAL + MODERATE, OVERLAPPING + LOW, etc.
 */

import type { IntakeData, RiskLevel } from './types.js';

export function evaluateRisk(intake: IntakeData, isUrgent: boolean = false): RiskLevel {
  if (isUrgent) {
    return 'URGENT';
  }

  const severity = intake.severity || 'none';
  const impact = intake.impact || 'none';
  const duration = intake.duration || 'less_than_1_week';

  // High risk: severe symptoms causing severe functional disruption
  if (severity === 'severe' && (impact === 'severe_disruption' || duration === 'more_than_6_months')) {
    return 'HIGH';
  }

  // Moderate risk: moderate severity/impact or severe without extreme disruption or chronic duration
  if (
    severity === 'moderate' ||
    impact === 'moderate' ||
    severity === 'severe' ||
    impact === 'severe_disruption' ||
    duration === '1_to_6_months' ||
    duration === 'more_than_6_months'
  ) {
    return 'MODERATE';
  }

  return 'LOW';
}
