import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';

interface ProcessingProps {
  currentLang: Language;
  onComplete: () => void;
}

export const Processing: React.FC<ProcessingProps> = ({ currentLang, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'processing_step1',
    'processing_step2',
    'processing_step3',
    'processing_step4',
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStep(1), 500);
    const timer2 = setTimeout(() => setActiveStep(2), 1000);
    const timer3 = setTimeout(() => setActiveStep(3), 1500);
    const timer4 = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-8">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-700 animate-pulse">
          <ShieldCheck className="w-10 h-10" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {getTranslation('processing_title', currentLang)}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Applying deterministic safety rules and structuring evidence
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5 text-left">
        {steps.map((stepKey, idx) => {
          const isDone = activeStep > idx;
          const isCurrent = activeStep === idx;

          return (
            <div
              key={stepKey}
              className={`flex items-center gap-3 text-xs sm:text-sm transition-opacity duration-300 ${
                isDone || isCurrent ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span
                className={
                  isCurrent
                    ? 'font-medium text-slate-900'
                    : isDone
                    ? 'text-slate-600'
                    : 'text-slate-400'
                }
              >
                {getTranslation(stepKey, currentLang)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
