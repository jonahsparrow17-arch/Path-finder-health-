/**
 * PathFinder Health - Authoritative Safety Service
 * Evaluates intake evidence against red_flags.json rules.
 * Core Principle: Urgency must always take precedence over normal classification.
 * Fail-Closed Rule: If safety configuration is missing or tampered, block decision.
 */

import { loadAndValidateConfig } from './config.js';
import { normalizeText } from './normalization.js';
import type { IntakeData, SafetyCheckResult, RedFlagRule } from './types.js';

export function evaluateSafety(intake: IntakeData): SafetyCheckResult {
  let config;
  try {
    config = loadAndValidateConfig();
  } catch (err: any) {
    return {
      status: 'BLOCKED',
      is_urgent: false,
      triggered_rules: [],
      urgent_reasons: ['Safety configuration unavailable.'],
      safety_config_version: 'UNKNOWN',
      safety_config_hash: 'UNKNOWN',
      error_code: 'SAFETY_CONFIGURATION_BLOCKED',
      message_key: 'safe_configuration_unavailable',
    };
  }

  const redFlagsConfig = config.redFlagsConfig;
  const redFlagsHash = config.redFlagsHash;

  if (!redFlagsConfig || !redFlagsConfig.rules || redFlagsConfig.rules.length === 0) {
    return {
      status: 'BLOCKED',
      is_urgent: false,
      triggered_rules: [],
      urgent_reasons: ['Safety rules not configured.'],
      safety_config_version: redFlagsConfig?.version || 'UNKNOWN',
      safety_config_hash: redFlagsHash || 'UNKNOWN',
      error_code: 'SAFETY_CONFIGURATION_BLOCKED',
      message_key: 'safe_configuration_unavailable',
    };
  }

  const normalizedFreeText = normalizeText(intake.free_text || '');
  const structuredSymptoms = new Set([
    ...(intake.physical_symptoms || []),
    ...(intake.mental_symptoms || []),
  ]);

  const triggeredRuleIds: string[] = [];
  const urgentReasons: string[] = [];

  for (const rule of redFlagsConfig.rules) {
    if (!rule.enabled) continue;

    let matched = false;

    // 1. Check structured symptoms
    if (rule.structured_symptoms && rule.structured_symptoms.length > 0) {
      for (const symptom of rule.structured_symptoms) {
        if (structuredSymptoms.has(symptom)) {
          matched = true;
          break;
        }
      }
    }

    // 2. Check free text against keywords in English, Tamil, and Mixed
    if (!matched && normalizedFreeText.length > 0) {
      const allKeywords = [
        ...(rule.keywords_en || []),
        ...(rule.keywords_ta || []),
        ...(rule.keywords_mixed || []),
      ];

      for (const kw of allKeywords) {
        const normalizedKw = normalizeText(kw);
        if (normalizedKw && normalizedFreeText.includes(normalizedKw)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      triggeredRuleIds.push(rule.rule_id);
      urgentReasons.push(rule.description);
    }
  }

  if (triggeredRuleIds.length > 0) {
    return {
      status: 'TRIGGERED',
      is_urgent: true,
      triggered_rules: triggeredRuleIds,
      urgent_reasons: urgentReasons,
      safety_config_version: redFlagsConfig.version,
      safety_config_hash: redFlagsHash,
    };
  }

  return {
    status: 'CLEAR',
    is_urgent: false,
    triggered_rules: [],
    urgent_reasons: [],
    safety_config_version: redFlagsConfig.version,
    safety_config_hash: redFlagsHash,
  };
}
