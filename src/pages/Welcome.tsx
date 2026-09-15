import React from 'react';
import { ArrowRight, Sparkles, Shield, Lock, FileCheck, Stethoscope } from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import { DecorativeCanvas } from '../components/three/DecorativeCanvas.js';

interface WelcomeProps {
  currentLang: Language;
  onStart: () => void;
  onOpenDemo: () => void;
  onOpenHistory: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({
  currentLang,
  onStart,
  onOpenDemo,
  onOpenHistory,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Decorative Visual & Header */}
      <div className="relative rounded-2xl bg-gradient-to-b from-teal-50/70 via-slate-50 to-white border border-teal-100/80 p-6 sm:p-10 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/80 text-teal-800 border border-teal-200/60">
              <Shield className="w-3.5 h-3.5 text-teal-700" />
              <span>Safety-First Healthcare Navigation</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              {getTranslation('welcome_title', currentLang)}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
              {getTranslation('welcome_subtitle', currentLang)}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                id="btn-welcome-start"
                onClick={onStart}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <span>{getTranslation('welcome_start_button', currentLang)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-welcome-demo"
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium text-sm sm:text-base transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{getTranslation('welcome_demo_button', currentLang)}</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center justify-center">
            <div className="w-48 h-48 sm:w-56 sm:h-56 relative rounded-xl bg-white/60 border border-slate-100 shadow-inner flex items-center justify-center">
              <DecorativeCanvas accentColor="#0d9488" />
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Scope & Architecture */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Deterministic Engine</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Symptom classification is determined strictly by versioned, auditable rules. The AI layer does not decide outcomes.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Authoritative Safety Gate</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Emergency indicators immediately take precedence, safely guiding you to emergency services before general classification.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Strict Privacy & Ephemeral Data</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            No name, email, or telephone numbers are collected. Records are auto-purged in 30 days and erasable on demand.
          </p>
        </div>
      </div>

      {/* Mandatory Legal & Clinical Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
        <FileCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Notice: </span>
          {getTranslation('welcome_disclaimer', currentLang)}
        </div>
      </div>
    </div>
  );
};
