import React, { useState, useEffect } from 'react';
import type { Language } from './i18n/index.js';
import { Header } from './components/layout/Header.js';
import { StepIndicator, type AppStep } from './components/layout/StepIndicator.js';
import { Welcome } from './pages/Welcome.js';
import { Consent } from './pages/Consent.js';
import { Intake } from './pages/Intake.js';
import { Screening } from './pages/Screening.js';
import { Processing } from './pages/Processing.js';
import { Results } from './pages/Results.js';
import { Urgent } from './pages/Urgent.js';
import { Navigation } from './pages/Navigation.js';
import { Summary } from './pages/Summary.js';
import { History } from './pages/History.js';
import { DemoModal } from './components/modals/DemoModal.js';
import type { IntakeData, AssessmentResult, ScreeningReadiness, DemoScenario } from '../server/types.js';
import {
  createSession,
  submitAssessment,
  fetchScreeningStatus,
  type SessionAuth,
} from './services/api.js';
import { saveToLocalHistory } from './services/history.js';

const EMPTY_INTAKE: IntakeData = {
  physical_symptoms: [],
  mental_symptoms: [],
  duration: null,
  severity: null,
  impact: null,
  free_text: null,
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('WELCOME');
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('pathfinder_lang');
    return saved === 'ta' ? 'ta' : 'en';
  });

  const [sessionAuth, setSessionAuth] = useState<SessionAuth | null>(null);
  const [intakeData, setIntakeData] = useState<IntakeData>(EMPTY_INTAKE);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [screeningStatus, setScreeningStatus] = useState<ScreeningReadiness | null>(null);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Synchronize language selection
  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('pathfinder_lang', lang);
    } catch (_) {}
  };

  // Fetch screening gate status on mount
  useEffect(() => {
    fetchScreeningStatus()
      .then((status) => setScreeningStatus(status))
      .catch(() => {
        setScreeningStatus({
          status: 'BLOCKED',
          available_instruments: [],
          error_code: 'SCREENING_UNAVAILABLE',
          error_message_key: 'screening_unavailable',
          verified_at: null,
        });
      });
  }, []);

  // Handler: Start from Welcome
  const handleStart = () => {
    setGlobalError(null);
    setCurrentStep('CONSENT');
  };

  // Handler: Accept Consent
  const handleAcceptConsent = async () => {
    try {
      setGlobalError(null);
      if (!sessionAuth) {
        const auth = await createSession(currentLang);
        setSessionAuth(auth);
      }
      setCurrentStep('INTAKE');
    } catch (err: any) {
      setGlobalError(err.message || 'Unable to establish secure session.');
    }
  };

  // Handler: Decline Consent
  const handleDeclineConsent = () => {
    setCurrentStep('WELCOME');
  };

  // Handler: Submit Intake
  const handleIntakeContinue = (data: IntakeData) => {
    setIntakeData(data);
    setCurrentStep('SCREENING');
  };

  // Handler: Proceed from Screening
  const handleScreeningProceed = () => {
    setCurrentStep('PROCESSING');
  };

  // Handler: Execute Evaluation in Processing step
  const handleProcessingComplete = async () => {
    try {
      setGlobalError(null);
      let auth = sessionAuth;
      if (!auth) {
        auth = await createSession(currentLang);
        setSessionAuth(auth);
      }

      const result = await submitAssessment(intakeData, auth);
      setAssessmentResult(result);

      // Save to local storage history
      saveToLocalHistory({
        id: result.session_id,
        date: result.created_at,
        classification: result.classification,
        risk_level: result.risk_level,
        evidence_coverage: result.evidence_coverage,
        status: result.status,
      });

      // Strict fail-closed / urgent routing:
      // If safety gate triggered or risk is URGENT, redirect to URGENT screen
      if (result.status === 'URGENT' || result.risk_level === 'URGENT') {
        setCurrentStep('URGENT');
      } else {
        setCurrentStep('RESULTS');
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Scoring engine evaluation failed.');
      setCurrentStep('INTAKE');
    }
  };

  // Handler: Select Demo Scenario
  const handleSelectDemoScenario = async (scenario: DemoScenario) => {
    setIsDemoModalOpen(false);
    setIsDemoActive(true);
    setIntakeData(scenario.intake);
    setGlobalError(null);

    // Initialize session for the demo
    try {
      const auth = await createSession(currentLang);
      setSessionAuth(auth);
    } catch (_) {}

    // Navigate to Intake so user can see pre-filled values
    setCurrentStep('INTAKE');
  };

  // Reset all session state
  const handleReset = () => {
    setAssessmentResult(null);
    setIntakeData(EMPTY_INTAKE);
    setSessionAuth(null);
    setIsDemoActive(false);
    setGlobalError(null);
    setCurrentStep('WELCOME');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900 font-sans antialiased">
      {/* Top Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onOpenHistory={() => setCurrentStep('HISTORY')}
        onGoHome={handleReset}
        isDemoActive={isDemoActive}
      />

      {/* Global Error Notice if any */}
      {globalError && (
        <div className="max-w-3xl mx-auto px-4 pt-4 w-full">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
            <span>{globalError}</span>
            <button
              onClick={() => setGlobalError(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-semibold underline ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Step Progress Tracker */}
      <StepIndicator currentStep={currentStep} currentLang={currentLang} />

      {/* Main View Transition Stage */}
      <main className="flex-1 pb-16">
        {currentStep === 'WELCOME' && (
          <Welcome
            currentLang={currentLang}
            onStart={handleStart}
            onOpenDemo={() => setIsDemoModalOpen(true)}
            onOpenHistory={() => setCurrentStep('HISTORY')}
          />
        )}

        {currentStep === 'CONSENT' && (
          <Consent
            currentLang={currentLang}
            onAccept={handleAcceptConsent}
            onDecline={handleDeclineConsent}
          />
        )}

        {currentStep === 'INTAKE' && (
          <Intake
            currentLang={currentLang}
            initialData={intakeData}
            onContinue={handleIntakeContinue}
            onBack={() => setCurrentStep('CONSENT')}
          />
        )}

        {currentStep === 'SCREENING' && (
          <Screening
            currentLang={currentLang}
            screeningStatus={screeningStatus}
            onProceed={handleScreeningProceed}
            onBack={() => setCurrentStep('INTAKE')}
          />
        )}

        {currentStep === 'PROCESSING' && (
          <Processing
            currentLang={currentLang}
            onComplete={handleProcessingComplete}
          />
        )}

        {currentStep === 'RESULTS' && assessmentResult && (
          <Results
            currentLang={currentLang}
            result={assessmentResult}
            onContinueToCare={() => setCurrentStep('NAVIGATION')}
            onReset={handleReset}
          />
        )}

        {currentStep === 'URGENT' && assessmentResult && (
          <Urgent
            currentLang={currentLang}
            result={assessmentResult}
            onReset={handleReset}
          />
        )}

        {currentStep === 'NAVIGATION' && assessmentResult && (
          <Navigation
            currentLang={currentLang}
            result={assessmentResult}
            onProceedToSummary={() => setCurrentStep('SUMMARY')}
            onBackToResults={() => setCurrentStep('RESULTS')}
          />
        )}

        {currentStep === 'SUMMARY' && assessmentResult && (
          <Summary
            currentLang={currentLang}
            result={assessmentResult}
            sessionAuth={sessionAuth}
            onReset={handleReset}
          />
        )}

        {currentStep === 'HISTORY' && (
          <History
            currentLang={currentLang}
            onBack={() => setCurrentStep('WELCOME')}
          />
        )}
      </main>

      {/* Demo Scenarios Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        currentLang={currentLang}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectScenario={handleSelectDemoScenario}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 px-4 text-center text-[11px] text-slate-700">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PathFinder Health — Non-Diagnostic Screening & Care Navigation System</span>
          <span className="text-slate-700">Rule-Based Deterministic Engine • Version 1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
