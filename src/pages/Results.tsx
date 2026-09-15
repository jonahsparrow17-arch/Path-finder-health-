import React from 'react';
import {
  ArrowRight,
  RefreshCw,
  Compass,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import type { AssessmentResult } from '../../server/types.js';

interface ResultsProps {
  currentLang: Language;
  result: AssessmentResult;
  onContinueToCare: () => void;
  onReset: () => void;
}

export const Results: React.FC<ResultsProps> = ({
  currentLang,
  result,
  onContinueToCare,
  onReset,
}) => {
  const coveragePercent = Math.round((result.evidence_coverage || 0) * 100);

  // Classification styling badge
  const getClassificationBadge = (cls: string | null) => {
    switch (cls) {
      case 'PHYSICAL':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          dot: 'bg-emerald-600',
        };
      case 'MENTAL':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          dot: 'bg-indigo-600',
        };
      case 'OVERLAPPING':
        return {
          bg: 'bg-teal-50 border-teal-200 text-teal-900',
          dot: 'bg-teal-600',
        };
      default:
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          dot: 'bg-amber-600',
        };
    }
  };

  // Risk styling
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'MODERATE':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'LOW':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'URGENT':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const classStyle = getClassificationBadge(result.classification);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {getTranslation('results_title', currentLang)}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Evidence organized via deterministic classification rules (Config v{result.safety_config_version})
        </p>
      </div>

      {/* Primary Pathway & Acuity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {getTranslation('results_pathway_label', currentLang)}
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <span className={`w-3 h-3 rounded-full ${classStyle.dot}`} />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {result.classification
                  ? getTranslation(`pathway_${result.classification}`, currentLang)
                  : getTranslation('pathway_INSUFFICIENT_EVIDENCE', currentLang)}
              </h3>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {getTranslation('results_risk_label', currentLang)}
            </span>
            <div className="mt-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadge(
                  result.risk_level
                )}`}
              >
                {getTranslation(`risk_${result.risk_level}`, currentLang)}
              </span>
            </div>
          </div>
        </div>

        {/* Evidence Coverage Gauge (Dimension Completeness, NOT probability) */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-700" />
              {getTranslation('results_coverage_label', currentLang)}: {coveragePercent}%
            </span>
            <span className="text-slate-500 font-normal">Audited Dimension Completeness</span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-700 h-full rounded-full transition-all duration-500"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            {getTranslation('results_coverage_subtext', currentLang)}
          </p>
        </div>

        {/* Explainability Drivers (Strictly rendered from backend) */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-700" />
            <span>{getTranslation('results_drivers_heading', currentLang)}</span>
          </h4>

          <div className="space-y-2">
            {result.drivers && result.drivers.length > 0 ? (
              result.drivers.map((driver, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs flex items-start gap-2.5 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {driver.weight_impact === 'primary' ? 'Primary Driver: ' : 'Supporting Factor: '}
                    </span>
                    <span className="text-slate-600">{driver.detail}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No specific explanation drivers reported.</p>
            )}
          </div>
        </div>

        {/* Non-Diagnostic Disclaimer */}
        <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            This output is an evidence-organized care navigation pathway recommendation. It is not a clinical diagnosis or medical prognosis.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            id="btn-results-reset"
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{getTranslation('results_new_screening', currentLang)}</span>
          </button>

          <button
            id="btn-results-care"
            onClick={onContinueToCare}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all"
          >
            <span>{getTranslation('results_continue_care', currentLang)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
