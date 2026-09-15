/**
 * PathFinder Health - AI/NLP Assistance Service
 * Non-authoritative candidate symptom extractor.
 * Strictly forbidden from making diagnoses, overriding safety rules, or predicting diseases.
 */

import { GoogleGenAI } from '@google/genai';
import { loadAndValidateConfig } from './config.js';
import { extractCandidateSymptomsFromText } from './normalization.js';

export interface AIAssistanceResult {
  status: 'success' | 'rule_based_fallback' | 'unavailable';
  candidate_physical_symptoms: string[];
  candidate_mental_symptoms: string[];
  source: 'gemini_nlp' | 'rule_based_nlp';
}

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const config = loadAndValidateConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey });
    } catch (_) {
      return null;
    }
  }
  return genAIClient;
}

export async function extractCandidateEvidenceWithAI(
  freeText: string
): Promise<AIAssistanceResult> {
  const fallback = extractCandidateSymptomsFromText(freeText);

  if (!freeText || freeText.trim().length === 0) {
    return {
      status: 'rule_based_fallback',
      candidate_physical_symptoms: [],
      candidate_mental_symptoms: [],
      source: 'rule_based_nlp',
    };
  }

  const ai = getGenAI();
  if (!ai) {
    return {
      status: 'rule_based_fallback',
      candidate_physical_symptoms: fallback.physical,
      candidate_mental_symptoms: fallback.mental,
      source: 'rule_based_nlp',
    };
  }

  try {
    const prompt = `You are a strict clinical NLP text normalization assistant.
Analyze the following user health description. Identify any non-diagnostic candidate symptom keywords mentioned by the user from these standard categories:
Physical categories: joint_pain, stiffness, tension_headache, fatigue, muscle_ache, stomach_discomfort, dizziness, back_pain
Mental categories: persistent_sadness, loss_of_interest, low_energy, sleep_disturbance, nervousness, racing_thoughts, difficulty_relaxing, hopelessness

DO NOT DIAGNOSE. DO NOT PREDICT DISEASE. DO NOT SUGGEST TREATMENTS.
Return ONLY valid JSON with this exact schema:
{
  "physical": ["joint_pain", ...],
  "mental": ["persistent_sadness", ...]
}

User text: "${freeText.replace(/"/g, '\\"')}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('Empty AI response');
    }

    const parsed = JSON.parse(responseText);
    const validPhysical = Array.isArray(parsed.physical)
      ? parsed.physical.filter((s: string) => typeof s === 'string')
      : [];
    const validMental = Array.isArray(parsed.mental)
      ? parsed.mental.filter((s: string) => typeof s === 'string')
      : [];

    // Union with deterministic fallback to ensure no missed terms
    const combinedPhysical = Array.from(new Set([...fallback.physical, ...validPhysical]));
    const combinedMental = Array.from(new Set([...fallback.mental, ...validMental]));

    return {
      status: 'success',
      candidate_physical_symptoms: combinedPhysical,
      candidate_mental_symptoms: combinedMental,
      source: 'gemini_nlp',
    };
  } catch (err) {
    // Graceful fail-open to deterministic extraction
    return {
      status: 'rule_based_fallback',
      candidate_physical_symptoms: fallback.physical,
      candidate_mental_symptoms: fallback.mental,
      source: 'rule_based_nlp',
    };
  }
}
