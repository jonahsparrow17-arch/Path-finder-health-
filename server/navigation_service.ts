/**
 * PathFinder Health - Care Navigation Service
 * Returns authoritative pathway care navigation from navigation_rules.json.
 * Rule: Never provide medications, dosages, or clinical diagnoses.
 */

import { loadAndValidateConfig } from './config.js';
import type { ClassificationType, NavigationPathway } from './types.js';

export function getNavigationPathway(
  classification: ClassificationType | null,
  isUrgent: boolean = false
): NavigationPathway {
  const config = loadAndValidateConfig();
  const rules = config.navigationRules.pathways;

  if (isUrgent || !classification) {
    return rules['URGENT'] || {
      title_key: 'nav_urgent_title',
      subtitle_key: 'nav_urgent_subtitle',
      recommended_services: ['Emergency Medical Services (911 / 112 / 108)'],
      preparation_steps: ['Seek immediate emergency evaluation'],
      disclaimer_key: 'disclaimer_urgent',
    };
  }

  return rules[classification] || rules['INSUFFICIENT_EVIDENCE'];
}
