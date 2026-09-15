import React from 'react';
import { HeartPulse, Globe, History, Sparkles, ShieldCheck } from 'lucide-react';
import type { Language } from '../../i18n/index.js';
import { getTranslation } from '../../i18n/index.js';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenDemo: () => void;
  onOpenHistory: () => void;
  onGoHome: () => void;
  isDemoActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenDemo,
  onOpenHistory,
  onGoHome,
  isDemoActive = false,
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onGoHome}
          id="btn-brand-home"
          className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-teal-600 rounded-lg p-1"
          aria-label="PathFinder Health Home"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-800 transition-colors">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg">
                PathFinder
              </span>
              <span className="text-teal-700 font-medium text-xs sm:text-sm uppercase tracking-wider bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                Health
              </span>
            </div>
            <p className="text-xs text-slate-700 hidden sm:block">
              {getTranslation('app_tagline', currentLang)}
            </p>
          </div>
        </button>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Scenario Selector Button */}
          <button
            id="btn-header-demo"
            onClick={onOpenDemo}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm px-2.5 py-1.5 rounded-md font-medium transition-all ${
              isDemoActive
                ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="Open Judge Demo Scenarios"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xs:inline">Demo Scenarios</span>
            <span className="xs:hidden">Demo</span>
          </button>

          {/* History Button */}
          <button
            id="btn-header-history"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
            title="View Local History"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{getTranslation('nav_history', currentLang)}</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
            <button
              id="btn-lang-en"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                currentLang === 'en'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              id="btn-lang-ta"
              onClick={() => onLanguageChange('ta')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                currentLang === 'ta'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              aria-label="Switch to Tamil (தமிழ்)"
            >
              தமிழ்
            </button>
          </div>
        </div>
      </div>

      {isDemoActive && (
        <div className="bg-amber-500/15 border-b border-amber-300 text-amber-900 px-4 py-1 text-center text-xs font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>{getTranslation('demo_mode_badge', currentLang)}</span>
        </div>
      )}
    </header>
  );
};
