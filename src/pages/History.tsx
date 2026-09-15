import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Trash2, ArrowLeft, Calendar, ShieldCheck, Activity } from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import {
  getLocalHistory,
  deleteLocalHistoryItem,
  clearLocalHistory,
  type HistoryItem,
} from '../services/history.js';

interface HistoryProps {
  currentLang: Language;
  onBack: () => void;
}

export const History: React.FC<HistoryProps> = ({ currentLang, onBack }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistoryItems(getLocalHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteLocalHistoryItem(id);
    setHistoryItems(getLocalHistory());
  };

  const handleClearAll = () => {
    if (!confirm('Clear all local screening history records?')) return;
    clearLocalHistory();
    setHistoryItems([]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-teal-700" />
            <span>{getTranslation('history_title', currentLang)}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {getTranslation('history_subtitle', currentLang)}
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            id="btn-history-clear-all"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{getTranslation('history_clear_all', currentLang)}</span>
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <HistoryIcon className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs sm:text-sm text-slate-500">
            {getTranslation('history_empty', currentLang)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">
                    {item.classification
                      ? getTranslation(`pathway_${item.classification}`, currentLang)
                      : 'Urgent Safety Gate'}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.risk_level}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>Coverage: {Math.round(item.evidence_coverage * 100)}%</span>
                </div>
              </div>

              <button
                id={`btn-history-del-${item.id.slice(0, 8)}`}
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete local record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <button
          id="btn-history-back"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};
