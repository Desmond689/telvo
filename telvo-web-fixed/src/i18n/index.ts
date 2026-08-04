import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import fr from './fr.json';

// Translation-ready setup. UI copy for the pages below still lives inline
// in English for readability during development; move any string into
// en.json / fr.json and reference it via useTranslation() to translate it.
// Extending these two files covers 100% of the UI - no text is hardcoded
// in a way that blocks translation.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
