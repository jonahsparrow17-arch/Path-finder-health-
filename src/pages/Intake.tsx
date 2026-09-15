import React, { useState } from 'react';
import { Mic, MicOff, X, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import type { Language } from '../i18n/index.js';
import { getTranslation } from '../i18n/index.js';
import { useVoice } from '../hooks/useVoice.js';
import type {
  IntakeData,
  SymptomDuration,
  SymptomSeverity,
  SymptomImpact,
} from '../../server/types.js';

interface IntakeProps {
  currentLang: Language;
  initialData: IntakeData;
  onContinue: (data: IntakeData) => void;
  onBack: () => void;
}

const PHYSICAL_SYMPTOMS_LIST = [
  { id: 'joint_pain', key: 'symptom_joint_pain' },
  { id: 'stiffness', key: 'symptom_stiffness' },
  { id: 'tension_headache', key: 'symptom_tension_headache' },
  { id: 'fatigue', key: 'symptom_fatigue' },
  { id: 'muscle_ache', key: 'symptom_muscle_ache' },
  { id: 'stomach_discomfort', key: 'symptom_stomach_discomfort' },
  { id: 'dizziness', key: 'symptom_dizziness' },
  { id: 'back_pain', key: 'symptom_back_pain' },
];

const MENTAL_SYMPTOMS_LIST = [
  { id: 'persistent_sadness', key: 'symptom_persistent_sadness' },
  { id: 'loss_of_interest', key: 'symptom_loss_of_interest' },
  { id: 'low_energy', key: 'symptom_low_energy' },
  { id: 'sleep_disturbance', key: 'symptom_sleep_disturbance' },
  { id: 'nervousness', key: 'symptom_nervousness' },
  { id: 'racing_thoughts', key: 'symptom_racing_thoughts' },
  { id: 'difficulty_relaxing', key: 'symptom_difficulty_relaxing' },
  { id: 'hopelessness', key: 'symptom_hopelessness' },
];

export const Intake: React.FC<IntakeProps> = ({
  currentLang,
  initialData,
  onContinue,
  onBack,
}) => {
  const [freeText, setFreeText] = useState(initialData.free_text || '');
  const [physicalSymptoms, setPhysicalSymptoms] = useState<string[]>(
    initialData.physical_symptoms || []
  );
  const [mentalSymptoms, setMentalSymptoms] = useState<string[]>(
    initialData.mental_symptoms || []
  );
  const [duration, setDuration] = useState<SymptomDuration | ''>(initialData.duration || '');
  const [severity, setSeverity] = useState<SymptomSeverity | ''>(initialData.severity || '');
  const [impact, setImpact] = useState<SymptomImpact | ''>(initialData.impact || '');

  const voice = useVoice();

  const handleVoiceResult = (text: string) => {
    setFreeText((prev) => (prev ? `${prev} ${text}` : text).slice(0, 2000));
  };

  const toggleSymptom = (id: string, isPhysical: boolean) => {
    if (isPhysical) {
      setPhysicalSymptoms((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setMentalSymptoms((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      physical_symptoms: physicalSymptoms,
      mental_symptoms: mentalSymptoms,
      duration: duration ? (duration as SymptomDuration) : null,
      severity: severity ? (severity as SymptomSeverity) : null,
      impact: impact ? (impact as SymptomImpact) : null,
      free_text: freeText.trim() || null,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {getTranslation('intake_title', currentLang)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {getTranslation('intake_subtitle', currentLang)}
          </p>
        </div>

        {/* Free Text Input & Voice Recognition */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="textarea-freetext"
              className="block text-xs sm:text-sm font-semibold text-slate-800"
            >
              {getTranslation('intake_free_text_label', currentLang)}
            </label>

            <div className="flex items-center gap-1.5">
              {voice.isListening ? (
                <>
                  <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-medium animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    {getTranslation('intake_voice_listening', currentLang)}
                  </span>
                  <button
                    type="button"
                    onClick={voice.stopListening}
                    className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-medium"
                    title={getTranslation('intake_voice_stop', currentLang)}
                  >
                    <MicOff className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={voice.cancelListening}
                    className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs"
                    title={getTranslation('intake_voice_cancel', currentLang)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => voice.startListening(handleVoiceResult, currentLang)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-medium transition-colors"
                >
                  <Mic className="w-3.5 h-3.5 text-teal-700" />
                  <span>{getTranslation('intake_voice_start', currentLang)}</span>
                </button>
              )}
            </div>
          </div>

          {voice.error && (
            <div className="p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{voice.error}</span>
            </div>
          )}

          <textarea
            id="textarea-freetext"
            rows={3}
            maxLength={2000}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={getTranslation('intake_free_text_placeholder', currentLang)}
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
          />

          <div className="flex justify-between items-center text-[11px] text-slate-700">
            <span>English, தமிழ், and Tanglish text supported</span>
            <span>{freeText.length} / 2000</span>
          </div>
        </div>

        {/* Structured Symptoms Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Physical Symptoms */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>{getTranslation('intake_physical_heading', currentLang)}</span>
              <span className="text-[11px] text-teal-800 font-medium">
                {physicalSymptoms.length} selected
              </span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {PHYSICAL_SYMPTOMS_LIST.map((symp) => {
                const isChecked = physicalSymptoms.includes(symp.id);
                return (
                  <label
                    key={symp.id}
                    className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'border-teal-500 bg-teal-50/60 text-teal-900 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`chk-phys-${symp.id}`}
                      checked={isChecked}
                      onChange={() => toggleSymptom(symp.id, true)}
                      className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{getTranslation(symp.key, currentLang)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Mental / Emotional Symptoms */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>{getTranslation('intake_mental_heading', currentLang)}</span>
              <span className="text-[11px] text-teal-800 font-medium">
                {mentalSymptoms.length} selected
              </span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {MENTAL_SYMPTOMS_LIST.map((symp) => {
                const isChecked = mentalSymptoms.includes(symp.id);
                return (
                  <label
                    key={symp.id}
                    className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'border-teal-500 bg-teal-50/60 text-teal-900 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`chk-mental-${symp.id}`}
                      checked={isChecked}
                      onChange={() => toggleSymptom(symp.id, false)}
                      className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{getTranslation(symp.key, currentLang)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline, Intensity & Impact Selectors */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Duration */}
            <div>
              <label
                htmlFor="select-duration"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                {getTranslation('intake_duration_heading', currentLang)}
              </label>
              <select
                id="select-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value as SymptomDuration)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="">-- Select duration --</option>
                <option value="less_than_1_week">
                  {getTranslation('duration_less_than_1_week', currentLang)}
                </option>
                <option value="1_to_4_weeks">
                  {getTranslation('duration_1_to_4_weeks', currentLang)}
                </option>
                <option value="1_to_6_months">
                  {getTranslation('duration_1_to_6_months', currentLang)}
                </option>
                <option value="more_than_6_months">
                  {getTranslation('duration_more_than_6_months', currentLang)}
                </option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label
                htmlFor="select-severity"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                {getTranslation('intake_severity_heading', currentLang)}
              </label>
              <select
                id="select-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SymptomSeverity)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="">-- Select severity --</option>
                <option value="none">{getTranslation('severity_none', currentLang)}</option>
                <option value="mild">{getTranslation('severity_mild', currentLang)}</option>
                <option value="moderate">{getTranslation('severity_moderate', currentLang)}</option>
                <option value="severe">{getTranslation('severity_severe', currentLang)}</option>
              </select>
            </div>

            {/* Functional Impact */}
            <div>
              <label
                htmlFor="select-impact"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                {getTranslation('intake_impact_heading', currentLang)}
              </label>
              <select
                id="select-impact"
                value={impact}
                onChange={(e) => setImpact(e.target.value as SymptomImpact)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="">-- Select daily impact --</option>
                <option value="none">{getTranslation('impact_none', currentLang)}</option>
                <option value="mild">{getTranslation('impact_mild', currentLang)}</option>
                <option value="moderate">{getTranslation('impact_moderate', currentLang)}</option>
                <option value="severe_disruption">
                  {getTranslation('impact_severe_disruption', currentLang)}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            id="btn-intake-back"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getTranslation('intake_back', currentLang)}</span>
          </button>

          <button
            type="submit"
            id="btn-intake-continue"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-xs hover:shadow transition-all"
          >
            <span>{getTranslation('intake_continue', currentLang)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
