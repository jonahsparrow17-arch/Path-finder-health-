import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, ArrowLeft, HeartPulse, CheckCircle2 } from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import type { AssessmentResult } from '../../server/types.js';

interface UrgentProps {
  currentLang: Language;
  result: AssessmentResult;
  onReset: () => void;
}

export const Urgent: React.FC<UrgentProps> = ({ currentLang, result, onReset }) => {
  const emergencyContacts = result.emergency_contacts || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Urgent Emergency Alert Header */}
      <div className="rounded-2xl border-2 border-rose-400 bg-rose-50/90 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900 uppercase tracking-wider mb-1">
              {getTranslation('urgent_alert', currentLang)}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-rose-950">
              {getTranslation('urgent_title', currentLang)}
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-rose-900 leading-relaxed font-medium">
          {getTranslation('urgent_lead', currentLang)}
        </p>

        {/* Emergency Indicators Detected */}
        {result.drivers && result.drivers.length > 0 && (
          <div className="bg-white/90 rounded-xl border border-rose-200 p-4 space-y-2">
            <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              {getTranslation('urgent_reasons_heading', currentLang)}:
            </h3>
            <ul className="space-y-1 text-xs sm:text-sm text-rose-950 list-disc list-inside">
              {result.drivers.map((d, i) => (
                <li key={i}>{d.detail}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Immediate Recommended Action Protocol */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-rose-600" />
          <span>{getTranslation('urgent_action_title', currentLang)}</span>
        </h3>

        <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p className="font-medium text-slate-900">{getTranslation('urgent_action_1', currentLang)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p>{getTranslation('urgent_action_2', currentLang)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p>{getTranslation('urgent_action_3', currentLang)}</p>
          </div>
        </div>

        {/* Verified Emergency Contacts List */}
        {emergencyContacts.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {getTranslation('urgent_contacts_heading', currentLang)}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">{contact.country}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                    <h5 className="font-semibold text-slate-900 text-xs sm:text-sm mt-0.5">
                      {contact.service_name}
                    </h5>
                  </div>
                  <div className="pt-1">
                    <a
                      href={`tel:${contact.contact_information.replace(/[^0-9]/g, '')}`}
                      className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-teal-700 hover:text-teal-800 tracking-wide"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{contact.contact_information}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safe Reset Option */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            id="btn-urgent-reset"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getTranslation('urgent_safe_reset', currentLang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
