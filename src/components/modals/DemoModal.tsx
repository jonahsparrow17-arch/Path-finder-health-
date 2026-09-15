import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import type { Language } from '../../i18n/index.js';
import { getTranslation } from '../../i18n/index.js';
import type { DemoScenario } from '../../../server/types.js';
import { fetchDemoScenarios } from '../../services/api.js';

interface DemoModalProps {
  isOpen: boolean;
  currentLang: Language;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  currentLang,
  onClose,
  onSelectScenario,
}) => {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchDemoScenarios()
        .then((data) => setScenarios(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="demo-modal-title" className="text-base font-bold text-slate-900">
                {getTranslation('demo_modal_title', currentLang)}
              </h3>
              <p className="text-xs text-slate-500">
                {getTranslation('demo_modal_subtitle', currentLang)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close demo modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              All demo scenarios use completely fictional clinical data for judge testing of deterministic pathways.
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading scenarios...</div>
          ) : (
            scenarios.map((sc) => {
              const isUrgent = sc.expected_pathway === 'URGENT';
              return (
                <div
                  key={sc.id}
                  onClick={() => onSelectScenario(sc)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-xs flex items-center justify-between gap-4 ${
                    isUrgent
                      ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/80 hover:border-rose-300'
                      : 'border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{sc.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        Target: {sc.expected_pathway}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{sc.description}</p>
                    <p className="text-[11px] text-slate-400 font-mono italic">
                      "{sc.intake.free_text}"
                    </p>
                  </div>

                  <div className="shrink-0">
                    <button
                      id={`btn-load-scenario-${sc.id}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                        isUrgent
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                      }`}
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200"
          >
            {getTranslation('demo_close', currentLang)}
          </button>
        </div>
      </div>
    </div>
  );
};
