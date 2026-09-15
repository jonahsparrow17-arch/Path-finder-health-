import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { Language } from '../../i18n/index.js';
import { getTranslation } from '../../i18n/index.js';

export type AppStep =
  | 'WELCOME'
  | 'CONSENT'
  | 'INTAKE'
  | 'SCREENING'
  | 'PROCESSING'
  | 'RESULTS'
  | 'URGENT'
  | 'NAVIGATION'
  | 'SUMMARY'
  | 'HISTORY';

interface StepIndicatorProps {
  currentStep: AppStep;
  currentLang: Language;
}

const STEPS: { key: AppStep; labelKey: string }[] = [
  { key: 'CONSENT', labelKey: 'nav_consent' },
  { key: 'INTAKE', labelKey: 'nav_intake' },
  { key: 'SCREENING', labelKey: 'nav_screening' },
  { key: 'RESULTS', labelKey: 'nav_results' },
  { key: 'NAVIGATION', labelKey: 'nav_care' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, currentLang }) => {
  if (['WELCOME', 'HISTORY', 'URGENT', 'SUMMARY'].includes(currentStep)) {
    return null;
  }

  const stepOrder: AppStep[] = ['CONSENT', 'INTAKE', 'SCREENING', 'PROCESSING', 'RESULTS', 'NAVIGATION'];
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4" aria-label="Progress">
      <nav aria-label="Screening steps" className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const stepIndex = stepOrder.indexOf(step.key);
          const isCompleted = currentIndex > stepIndex;
          const isCurrent = currentStep === step.key || (currentStep === 'PROCESSING' && step.key === 'SCREENING');

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-teal-700 text-white'
                      : isCurrent
                      ? 'bg-teal-100 text-teal-900 border-2 border-teal-700'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] sm:text-xs text-center font-medium line-clamp-1 ${
                    isCurrent ? 'text-teal-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {getTranslation(step.labelKey, currentLang)}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 sm:mx-2 mb-5 rounded transition-colors ${
                    currentIndex > stepIndex ? 'bg-teal-700' : 'bg-slate-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
