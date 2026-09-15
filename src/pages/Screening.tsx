import React from 'react';
import { ShieldAlert, ArrowRight, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import type { ScreeningReadiness } from '../../server/types.js';

interface ScreeningProps {
  currentLang: Language;
  screeningStatus: ScreeningReadiness | null;
  onProceed: () => void;
  onBack: () => void;
}

export const Screening: React.FC<ScreeningProps> = ({
  currentLang,
  screeningStatus,
  onProceed,
  onBack,
}) => {
  const isBlocked = !screeningStatus || screeningStatus.status !== 'READY';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {getTranslation('screening_title', currentLang)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {getTranslation('screening_status_heading', currentLang)}
          </p>
        </div>

        {/* Fail-Closed Verification Gate Display */}
        {isBlocked ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-900 font-semibold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
              <span>{getTranslation('screening_blocked_banner', currentLang)}</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              {getTranslation('screening_blocked_notice', currentLang)}
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-amber-800 font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-200/60 border border-amber-300">
                STATUS: {screeningStatus?.status || 'BLOCKED'}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-200/60 border border-amber-300">
                CODE: {screeningStatus?.error_code || 'SCREENING_SOURCE_MISSING'}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-900 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-700" />
              <span>Instruments Verified: {screeningStatus.available_instruments.join(', ')}</span>
            </div>
            <p className="text-xs text-teal-800">
              Official publisher source PDFs and cryptographic hashes verified.
            </p>
          </div>
        )}

        {/* Non-Diagnostic Assurance */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            PathFinder’s core deterministic classification engine operates on your structured intake evidence, timeline, and functional impact without requiring unverified questionnaire scores.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            id="btn-screening-back"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getTranslation('intake_back', currentLang)}</span>
          </button>

          <button
            id="btn-screening-proceed"
            onClick={onProceed}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-xs hover:shadow transition-all"
          >
            <span>{getTranslation('screening_skip_button', currentLang)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
