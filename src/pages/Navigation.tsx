import React from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building2,
  ListOrdered,
  AlertCircle,
} from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import type { AssessmentResult } from '../../server/types.js';

interface NavigationProps {
  currentLang: Language;
  result: AssessmentResult;
  onProceedToSummary: () => void;
  onBackToResults: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentLang,
  result,
  onProceedToSummary,
  onBackToResults,
}) => {
  const nav = result.navigation;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {nav ? getTranslation(nav.title_key, currentLang) : getTranslation('nav_physical_title', currentLang)}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {nav ? getTranslation(nav.subtitle_key, currentLang) : ''}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        {/* Recommended Services */}
        <div className="space-y-3">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>{getTranslation('nav_recommended_services', currentLang)}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {nav?.recommended_services.map((srv, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5 text-xs sm:text-sm"
              >
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span className="font-medium text-slate-800">{srv}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preparation Steps */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-teal-700" />
            <span>{getTranslation('nav_prep_steps', currentLang)}</span>
          </h3>

          <div className="space-y-2">
            {nav?.preparation_steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 bg-white flex items-start gap-3 text-xs sm:text-sm"
              >
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-slate-700 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Boundary Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            PathFinder Health provides care-navigation guidance. We do not prescribe medications, recommend pharmaceutical dosages, or formulate personalized treatment plans.
          </span>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            id="btn-nav-back"
            onClick={onBackToResults}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Results</span>
          </button>

          <button
            id="btn-nav-summary"
            onClick={onProceedToSummary}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all"
          >
            <span>{getTranslation('nav_view_summary', currentLang)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
