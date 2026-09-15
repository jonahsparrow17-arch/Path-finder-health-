import en from './en.json';
import ta from './ta.json';

export type Language = 'en' | 'ta';

const translations: Record<Language, Record<string, string>> = {
  en,
  ta,
};

export function getTranslation(key: string, lang: Language = 'en'): string {
  const currentDict = translations[lang] || translations.en;
  if (currentDict && currentDict[key]) {
    return currentDict[key];
  }
  // Fallback to English
  if (translations.en[key]) {
    return translations.en[key];
  }
  return key;
}
