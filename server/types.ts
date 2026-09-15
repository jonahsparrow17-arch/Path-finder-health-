/**
 * PathFinder Health - Core TypeScript Type Definitions
 * Strict contracts for backend services and API schemas.
 */

export type ClassificationType = 'PHYSICAL' | 'MENTAL' | 'OVERLAPPING' | 'INSUFFICIENT_EVIDENCE';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
export type SafetyStatus = 'CLEAR' | 'TRIGGERED' | 'BLOCKED';
export type ScreeningStatusType = 'READY' | 'BLOCKED' | 'EXPIRED' | 'INVALID';

export type SymptomDuration =
  | 'less_than_1_week'
  | '1_to_4_weeks'
  | '1_to_6_months'
  | 'more_than_6_months';

export type SymptomSeverity = 'none' | 'mild' | 'moderate' | 'severe';
export type SymptomImpact = 'none' | 'mild' | 'moderate' | 'severe_disruption';

export interface IntakeData {
  physical_symptoms: string[];
  mental_symptoms: string[];
  duration: SymptomDuration | null;
  severity: SymptomSeverity | null;
  impact: SymptomImpact | null;
  free_text: string | null;
}

export interface RedFlagRule {
  rule_id: string;
  version: string;
  enabled: boolean;
  category: string;
  severity: 'urgent';
  action: 'urgent';
  description: string;
  keywords_en: string[];
  keywords_ta: string[];
  keywords_mixed: string[];
  structured_symptoms: string[];
}

export interface RedFlagsConfig {
  version: string;
  hash_algorithm: string;
  last_updated: string;
  rules: RedFlagRule[];
}

export interface EmergencyContact {
  id: string;
  region: string;
  country: string;
  service_name: string;
  contact_information: string;
  source: string;
  verified_at: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED' | 'EXPIRED' | 'MISSING' | 'INVALID';
}

export interface EmergencyConfig {
  version: string;
  last_updated: string;
  contacts: EmergencyContact[];
}

export interface EvidenceVector {
  physical_symptoms_count: number;
  mental_symptoms_count: number;
  physical_score: number;
  mental_score: number;
  physical_coverage: number;
  mental_coverage: number;
  overall_coverage: number; // 0.0 to 1.0
  dimensions_provided: {
    symptoms: boolean;
    duration: boolean;
    severity: boolean;
    impact: boolean;
    free_text: boolean;
  };
}

export interface SafetyCheckResult {
  status: SafetyStatus;
  is_urgent: boolean;
  triggered_rules: string[];
  urgent_reasons: string[];
  safety_config_version: string;
  safety_config_hash: string;
  error_code?: string;
  message_key?: string;
}

export interface ExplainabilityDriver {
  type: 'physical' | 'mental' | 'duration' | 'severity' | 'impact' | 'safety' | 'insufficient';
  label_key: string;
  detail: string;
  weight_impact: 'primary' | 'secondary' | 'supporting';
}

export interface NavigationPathway {
  title_key: string;
  subtitle_key: string;
  recommended_services: string[];
  preparation_steps: string[];
  disclaimer_key: string;
}

export interface ScreeningReadiness {
  status: ScreeningStatusType;
  available_instruments: string[];
  error_code: string;
  error_message_key: string;
  verified_at: string | null;
}

export interface AssessmentResult {
  session_id: string;
  status: 'COMPLETED' | 'URGENT' | 'BLOCKED';
  classification: ClassificationType | null;
  risk_level: RiskLevel;
  safety_status: SafetyStatus;
  evidence_coverage: number; // 0.0 - 1.0 (coverage of dimensions, never disease probability)
  drivers: ExplainabilityDriver[];
  navigation: NavigationPathway | null;
  emergency_contacts?: EmergencyContact[];
  screening_status: ScreeningReadiness;
  safety_config_version: string;
  safety_config_hash: string;
  created_at: string;
}

export interface DemoScenario {
  id: string;
  name_en: string;
  name_ta: string;
  expected_classification: ClassificationType | null;
  expected_risk: RiskLevel;
  description: string;
  intake: IntakeData;
}
