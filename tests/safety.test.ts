import { describe, it, expect, beforeAll } from 'vitest';
import { evaluateSafety } from '../server/safety_service.js';
import { loadAndValidateConfig } from '../server/config.js';
import type { IntakeData } from '../server/types.js';

describe('Authoritative Safety Engine (Red Flags)', () => {
  beforeAll(() => {
    loadAndValidateConfig();
  });

  it('detects RF-001 Crushing chest pain in English text', () => {
    const intake: IntakeData = {
      physical_symptoms: [],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'I have severe crushing chest pain radiating to left arm',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.status).toBe('TRIGGERED');
    expect(result.triggered_rules).toContain('RF-001');
  });

  it('detects RF-001 in Tamil script (நெஞ்சு வலி)', () => {
    const intake: IntakeData = {
      physical_symptoms: [],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'எனக்கு திடீரென அதிக நெஞ்சு வலி மற்றும் மூச்சுத்திணறல் உள்ளது',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.status).toBe('TRIGGERED');
  });

  it('detects RF-001 in Tanglish / mixed Romanized Tamil (nenju vali)', () => {
    const intake: IntakeData = {
      physical_symptoms: [],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'nenju vali romba perusu breath panna mudiyala',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.status).toBe('TRIGGERED');
  });

  it('detects RF-002 Respiratory distress in structured input', () => {
    const intake: IntakeData = {
      physical_symptoms: ['unable_to_breathe'],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: null,
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.triggered_rules).toContain('RF-002');
  });

  it('detects RF-003 Neurological deficit / stroke signs', () => {
    const intake: IntakeData = {
      physical_symptoms: ['facial_droop', 'one_sided_weakness'],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'sudden numbness one side and slurred speech',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.triggered_rules).toContain('RF-003');
  });

  it('detects RF-004 Psychiatric emergency / active suicidal ideation', () => {
    const intake: IntakeData = {
      physical_symptoms: [],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'I want to kill myself and end it all today',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.triggered_rules).toContain('RF-004');
  });

  it('detects RF-005 Severe uncontrolled bleeding', () => {
    const intake: IntakeData = {
      physical_symptoms: ['uncontrolled_bleeding'],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'vomiting blood heavily after fall',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.triggered_rules).toContain('RF-005');
  });

  it('detects RF-006 Anaphylaxis / acute airway swelling', () => {
    const intake: IntakeData = {
      physical_symptoms: ['anaphylaxis'],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'severe allergic reaction closing airways and swelling of tongue and throat',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.triggered_rules).toContain('RF-006');
  });

  it('detects RF-007 Unconsciousness / prolonged seizure', () => {
    const intake: IntakeData = {
      physical_symptoms: ['unresponsive'],
      mental_symptoms: [],
      duration: 'less_than_1_week',
      severity: 'severe',
      impact: 'severe_disruption',
      free_text: 'passed out and not waking up',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(true);
    expect(result.triggered_rules).toContain('RF-007');
  });

  it('passes benign non-emergency symptoms without false positives', () => {
    const intake: IntakeData = {
      physical_symptoms: ['knee_ache'],
      mental_symptoms: [],
      duration: '1_to_4_weeks',
      severity: 'mild',
      impact: 'mild',
      free_text: 'I bumped my knee while gardening and have a minor ache.',
    };
    const result = evaluateSafety(intake);
    expect(result.is_urgent).toBe(false);
    expect(result.status).toBe('CLEAR');
    expect(result.triggered_rules.length).toBe(0);
  });
});
