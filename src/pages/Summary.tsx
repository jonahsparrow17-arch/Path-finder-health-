import React, { useState } from 'react';
import {
  Download,
  Trash2,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import type { AssessmentResult } from '../../server/types.js';
import type { SessionAuth } from '../services/api.js';
import { fetchExportDocument, deleteSessionRemote } from '../services/api.js';
import { deleteLocalHistoryItem } from '../services/history.js';

interface SummaryProps {
  currentLang: Language;
  result: AssessmentResult;
  sessionAuth: SessionAuth | null;
  onReset: () => void;
}

export const Summary: React.FC<SummaryProps> = ({
  currentLang,
  result,
  sessionAuth,
  onReset,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(result.session_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadExport = async () => {
    if (!sessionAuth) return;
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const doc = await fetchExportDocument(sessionAuth);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pathfinder_export_${result.session_id.slice(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      setErrorMessage(err.message || 'Export generation failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionAuth) return;
    if (!confirm('Are you sure you want to permanently erase this screening session?')) return;

    setIsDeleting(true);
    try {
      await deleteSessionRemote(sessionAuth);
      deleteLocalHistoryItem(sessionAuth.session_id);
      setIsDeleted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete remote session record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {getTranslation('summary_title', currentLang)}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review, export, or permanently erase your screening record
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isDeleted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="font-semibold text-emerald-900 text-sm">
            {getTranslation('summary_deleted_notice', currentLang)}
          </p>
          <button
            id="btn-summary-home-after-delete"
            onClick={onReset}
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
          >
            Return to Home
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          {/* Metadata */}
          <div className="space-y-3 border-b border-slate-100 pb-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{getTranslation('summary_session_id', currentLang)}:</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-800 font-medium">
                <span>{result.session_id.slice(0, 18)}...</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
                  title="Copy session ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedId && <span className="text-[10px] text-teal-600">Copied!</span>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">{getTranslation('summary_created_at', currentLang)}:</span>
              <span className="font-medium text-slate-800">{result.created_at}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Care Pathway:</span>
              <span className="font-semibold text-teal-800">
                {result.classification ? getTranslation(`pathway_${result.classification}`, currentLang) : 'Urgent Safety Gate'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Risk Level:</span>
              <span className="font-semibold text-slate-900">
                {getTranslation(`risk_${result.risk_level}`, currentLang)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Evidence Coverage:</span>
              <span className="font-medium text-slate-800">
                {Math.round(result.evidence_coverage * 100)}% of required dimensions
              </span>
            </div>
          </div>

          {/* Export Action */}
          <div className="space-y-2">
            <button
              id="btn-summary-export"
              onClick={handleDownloadExport}
              disabled={isExporting || !sessionAuth}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting ? 'Generating Export...' : getTranslation('summary_export_button', currentLang)}
              </span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Includes sanitized summary, drivers, care recommendations, and safety disclaimer. Tokens and secrets excluded.
            </p>
          </div>

          {/* Privacy Erasure */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              id="btn-summary-delete"
              onClick={handleDeleteSession}
              disabled={isDeleting || !sessionAuth}
              className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2.5 py-1.5 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Erasing...' : getTranslation('summary_delete_button', currentLang)}</span>
            </button>

            <button
              id="btn-summary-new-screening"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Start New</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
