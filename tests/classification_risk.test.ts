import { describe, it, expect } from 'vitest';
import { computeEvidenceVector } from '../server/evidence_service.js';
import { classify } from '../server/classification_service.js';
import { evaluateRisk } from '../server/risk_service.js';
import type { IntakeData } from '../server/types.js';

describe('Deterministic Classification & Independent Risk Engine', () => {
  it('correctly classifies PHYSICAL pathway', () => {
    const intake: IntakeData = {
      physical_symptoms: ['joint_pain', 'stiffness'],
      mental_symptoms: [],
      duration: '1_to_4_weeks',
      severity: 'moderate',
      impact: 'moderate',
      free_text: 'Right knee joint pain and morning stiffness.',
    };
    const evidence = computeEvidenceVector(intake);
    const classification = classify(evidence);
    const risk = evaluateRisk(intake);

    expect(classification).toBe('PHYSICAL');
    expect(risk).toBe('MODERATE');
    expect(evidence.overall_coverage).toBeGreaterThanOrEqual(0.8);
  });

  it('correctly classifies MENTAL pathway with independent HIGH risk', () => {
    const intake: IntakeData = {
      physical_symptoms: [],
      mental_symptoms: ['persistent_sadness', 'loss_of_interest', 'low_energy'],
      duration: 'more_than_6_months',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'Intense sadness and lack of motivation for past 7 months.',
    };
    const evidence = computeEvidenceVector(intake);
    const classification = classify(evidence);
    const risk = evaluateRisk(intake);

    expect(classification).toBe('MENTAL');
    // Verifies independent risk: MENTAL + HIGH
    expect(risk).toBe('HIGH');
  });

  it('correctly classifies OVERLAPPING pathway with independent LOW risk', () => {
    const intake: IntakeData = {
      physical_symptoms: ['tension_headache'],
      mental_symptoms: ['nervousness'],
      duration: 'less_than_1_week',
      severity: 'mild',
      impact: 'mild',
      free_text: 'Mild headache and slight nervousness before presentation.',
    };
    const evidence = computeEvidenceVector(intake);
    const classification = classify(evidence);
    const risk = evaluateRisk(intake);

    expect(classification).toBe('OVERLAPPING');
    // Verifies independent risk: OVERLAPPING + LOW
    expect(risk).toBe('LOW');
  });

  it('returns INSUFFICIENT_EVIDENCE when minimum criteria is missing', () => {
    const intake: IntakeData = {
      physical_symptoms: [],
      mental_symptoms: [],
      duration: null,
      severity: null,
      impact: null,
      free_text: 'I just feel strange today.',
    };
    const evidence = computeEvidenceVector(intake);
    const classification = classify(evidence);

    expect(classification).toBe('INSUFFICIENT_EVIDENCE');
    expect(evidence.overall_coverage).toBeLessThan(0.25);
  });

  it('Determinism test: 10 identical executions produce exactly identical results', () => {
    const intake: IntakeData = {
      physical_symptoms: ['fatigue', 'muscle_ache'],
      mental_symptoms: ['sleep_disturbance'],
      duration: '1_to_4_weeks',
      severity: 'moderate',
      impact: 'moderate',
      free_text: 'Tired and sore muscles, waking up early.',
    };

    const firstEvidence = computeEvidenceVector(intake);
    const firstClass = classify(firstEvidence);
    const firstRisk = evaluateRisk(intake);

    for (let i = 0; i < 10; i++) {
      const ev = computeEvidenceVector(intake);
      const cl = classify(ev);
      const rk = evaluateRisk(intake);

      expect(cl).toBe(firstClass);
      expect(rk).toBe(firstRisk);
      expect(ev.overall_coverage).toBe(firstEvidence.overall_coverage);
      expect(ev.physical_score).toBe(firstEvidence.physical_score);
      expect(ev.mental_score).toBe(firstEvidence.mental_score);
    }
  });
});
