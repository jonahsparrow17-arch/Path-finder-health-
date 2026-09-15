/**
 * PathFinder Health - Normalization Service
 * Handles Unicode normalization, case folding, alias mapping, and English/Tamil/Tanglish text.
 * Rule: Normalization must not itself make medical decisions or diagnoses.
 */

export interface NormalizedInput {
  raw_text: string;
  normalized_text: string;
  tokens: string[];
  extracted_candidate_symptoms: {
    physical: string[];
    mental: string[];
  };
}

// Symptom alias mappings
const PHYSICAL_SYMPTOM_ALIASES: Record<string, string[]> = {
  joint_pain: [
    'knee pain', 'joint pain', 'knee ache', 'joint ache', 'arthritis pain',
    'மூட்டு வலி', 'முழங்கால் வலி', 'moottu vali', 'muttu vali', 'joint vali'
  ],
  stiffness: [
    'stiffness', 'morning stiffness', 'stiff joints', 'stiff neck',
    'விறைப்பு', 'உடல் விறைப்பு', 'stiff aa irukku'
  ],
  tension_headache: [
    'headache', 'tension headache', 'head pain', 'migraine', 'throbbing head',
    'தலைவலி', 'தலைபாரம்', 'thalai vali', 'thala vali', 'thala baram'
  ],
  fatigue: [
    'fatigue', 'extreme tiredness', 'exhaustion', 'chronic fatigue', 'drained',
    'சோர்வு', 'உடல் சோர்வு', 'அசதி', 'sorvu', 'udal sorvu', 'asathi', 'tiredness'
  ],
  muscle_ache: [
    'muscle ache', 'muscle pain', 'body pain', 'sore muscles', 'body ache',
    'உடல் வலி', 'தசை வலி', 'udal vali', 'thasai vali', 'body vali'
  ],
  stomach_discomfort: [
    'stomach pain', 'stomach ache', 'nausea', 'abdominal pain', 'cramps', 'gastric',
    'வயிறு வலி', 'குமட்டல்', 'vayiru vali', 'kumattal', 'stomach problem'
  ],
  dizziness: [
    'dizziness', 'lightheaded', 'vertigo', 'feeling faint',
    'தலைச்சுற்றல்', 'மயக்கம்', 'thala suthal', 'mayakkam'
  ],
  back_pain: [
    'back pain', 'lower back pain', 'spine ache', 'lumbar pain',
    'முதுகு வலி', 'இடுப்பு வலி', 'muthugu vali', 'iduppu vali'
  ],
};

const MENTAL_SYMPTOM_ALIASES: Record<string, string[]> = {
  persistent_sadness: [
    'sadness', 'feeling low', 'depressed', 'crying spells', 'gloomy', 'down in the dumps',
    'மனச்சோர்வு', 'கவலை', 'சோகம்', 'manasorvu', 'kavalai', 'sogam', 'manasu seriyilla'
  ],
  loss_of_interest: [
    'loss of interest', 'no interest', 'anhedonia', 'lost pleasure', 'not enjoying things',
    'ஆர்வம் இன்மை', 'எதிலும் விருப்பமில்லை', 'aarvam illa', 'ethilum viruppam illa'
  ],
  low_energy: [
    'low energy', 'no energy', 'lethargic', 'lack of motivation', 'sluggish',
    'ஆற்றல் இன்மை', 'சக்தி இன்மை', 'energy illa', 'veppam illa', 'enthusiasm illa'
  ],
  sleep_disturbance: [
    'sleep disturbance', 'cannot sleep', 'insomnia', 'waking up early', 'broken sleep',
    'தூக்கமின்மை', 'தூக்கம் வரவில்லை', 'thookam varala', 'thookam illa', 'thookame varla'
  ],
  nervousness: [
    'nervousness', 'anxiety', 'feeling anxious', 'panic', 'worrying constantly', 'edgy',
    'பதட்டம்', 'பயம்', 'கலக்கம்', 'pathattam', 'bayama irukku', 'nervous aa irukku'
  ],
  racing_thoughts: [
    'racing thoughts', 'overthinking', 'can\'t stop thinking', 'rapid thoughts',
    'சிந்தனைகள் அலைமோதல்', 'அதிக சிந்தனை', 'overthinking panren', 'yosichite irukken'
  ],
  difficulty_relaxing: [
    'difficulty relaxing', 'cannot relax', 'restless', 'feeling on edge', 'fidgety',
    'அமைதியின்மை', 'ஓய்வெடுக்க முடியவில்லை', 'relax panna mudiyala', 'amaithi illa'
  ],
  hopelessness: [
    'hopelessness', 'feeling hopeless', 'no future', 'despair',
    'நம்பிக்கையின்மை', 'ஏமாற்றம்', 'nambikkai illa', 'hope illa'
  ],
};

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Preserve Unicode letters and numbers, strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractCandidateSymptomsFromText(text: string): {
  physical: string[];
  mental: string[];
} {
  const normalized = normalizeText(text);
  const physicalCandidates = new Set<string>();
  const mentalCandidates = new Set<string>();

  for (const [code, aliases] of Object.entries(PHYSICAL_SYMPTOM_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized.includes(normalizedAlias)) {
        physicalCandidates.add(code);
        break;
      }
    }
  }

  for (const [code, aliases] of Object.entries(MENTAL_SYMPTOM_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized.includes(normalizedAlias)) {
        mentalCandidates.add(code);
        break;
      }
    }
  }

  return {
    physical: Array.from(physicalCandidates),
    mental: Array.from(mentalCandidates),
  };
}

export function processInputNormalization(rawText: string | null): NormalizedInput {
  const safeText = rawText || '';
  const normalized = normalizeText(safeText);
  const tokens = normalized.split(' ').filter(Boolean);
  const candidates = extractCandidateSymptomsFromText(safeText);

  return {
    raw_text: safeText,
    normalized_text: normalized,
    tokens,
    extracted_candidate_symptoms: candidates,
  };
}
