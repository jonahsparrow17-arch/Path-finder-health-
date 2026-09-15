import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, Lock, Info } from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';

interface ConsentProps {
  currentLang: Language;
  onAccept: () => void;
  onDecline: () => void;
}

export const Consent: React.FC<ConsentProps> = ({ currentLang, onAccept, onDecline }) => {
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {getTranslation('consent_title', currentLang)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {getTranslation('consent_lead', currentLang)}
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-100 leading-relaxed">
          <p className="font-medium text-slate-900">{getTranslation('consent_p1', currentLang)}</p>
          <p>{getTranslation('consent_p2', currentLang)}</p>
          <p>{getTranslation('consent_p3', currentLang)}</p>
          <p>{getTranslation('consent_p4', currentLang)}</p>
        </div>

        {/* Checkbox verification */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-teal-200/80 bg-teal-50/40 cursor-pointer select-none hover:bg-teal-50/70 transition-colors">
          <input
            id="checkbox-consent-agree"
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
          />
          <span className="text-xs sm:text-sm text-slate-800 font-medium leading-normal">
            {getTranslation('consent_checkbox', currentLang)}
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            id="btn-consent-decline"
            onClick={onDecline}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getTranslation('consent_decline', currentLang)}</span>
          </button>

          <button
            id="btn-consent-accept"
            onClick={onAccept}
            disabled={!hasAgreed}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              hasAgreed
                ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                : 'bg-slate-200 text-slate-700 cursor-not-allowed'
            }`}
          >
            <span>{getTranslation('consent_accept', currentLang)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
