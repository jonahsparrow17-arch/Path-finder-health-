/**
 * PathFinder Health - Explainability Engine
 * Generates backend-authoritative structured explanation drivers.
 * Frontend displays ONLY these drivers without inventing reasoning.
 */

import type {
  ClassificationType,
  EvidenceVector,
  IntakeData,
  ExplainabilityDriver,
  RiskLevel,
} from './types.js';

export function generateDrivers(
  classification: ClassificationType | null,
  risk: RiskLevel,
  evidence: EvidenceVector,
  intake: IntakeData,
  urgentReasons: string[] = []
): ExplainabilityDriver[] {
  const drivers: ExplainabilityDriver[] = [];

  // Urgent Safety Driver
  if (risk === 'URGENT' || urgentReasons.length > 0) {
    drivers.push({
      type: 'safety',
      label_key: 'driver_safety_precedence',
      detail: urgentReasons.length > 0
        ? `Safety gate triggered due to emergency indicators: ${urgentReasons.join('; ')}`
        : 'Emergency safety indicator detected requiring priority attention.',
      weight_impact: 'primary',
    });
    return drivers;
  }

  // Classification Drivers
  if (classification === 'PHYSICAL') {
    drivers.push({
      type: 'physical',
      label_key: 'driver_physical_evidence',
      detail: `Reported physical symptoms (${evidence.physical_symptoms_count} identified) form the predominant evidence cluster.`,
      weight_impact: 'primary',
    });
  } else if (classification === 'MENTAL') {
    drivers.push({
      type: 'mental',
      label_key: 'driver_mental_evidence',
      detail: `Reported emotional and psychological symptoms (${evidence.mental_symptoms_count} identified) represent the primary evidence cluster.`,
      weight_impact: 'primary',
    });
  } else if (classification === 'OVERLAPPING') {
    drivers.push({
      type: 'physical',
      label_key: 'driver_physical_evidence',
      detail: `Physical evidence cluster identified with ${evidence.physical_symptoms_count} recognized symptoms.`,
      weight_impact: 'primary',
    });
    drivers.push({
      type: 'mental',
      label_key: 'driver_mental_evidence',
      detail: `Emotional/psychological evidence cluster identified with ${evidence.mental_symptoms_count} recognized symptoms.`,
      weight_impact: 'primary',
    });
  } else if (classification === 'INSUFFICIENT_EVIDENCE') {
    drivers.push({
      type: 'insufficient',
      label_key: 'driver_insufficient_evidence',
      detail: 'Provided evidence did not meet minimum criteria thresholds (insufficient recognized symptoms or missing duration/severity).',
      weight_impact: 'primary',
    });
  }

  // Duration driver
  if (intake.duration) {
    const formattedDuration = intake.duration.replace(/_/g, ' ');
    drivers.push({
      type: 'duration',
      label_key: 'driver_duration_impact',
      detail: `Symptom timeline documented as ${formattedDuration}, supporting clinical acuity weighting.`,
      weight_impact: 'secondary',
    });
  }

  // Severity & Impact driver
  if (intake.severity || intake.impact) {
    drivers.push({
      type: 'severity',
      label_key: 'driver_severity_functional_impact',
      detail: `Severity marked as ${intake.severity || 'unspecified'} with functional impact level of ${intake.impact || 'unspecified'}.`,
      weight_impact: 'supporting',
    });
  }

  return drivers;
}
