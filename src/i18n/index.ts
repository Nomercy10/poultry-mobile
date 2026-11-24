import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json';
import { isLanguageCode, type LanguageCode } from './languages';
import mr from './mr.json';

// Hindi and Marathi are first drafts and need native-speaker review before launch
// (docs/languages-and-easy-ui.md §5.7). Telugu and Tamil come next.
export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
} as const;

export type AppLanguage = LanguageCode;

function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return isLanguageCode(code) ? code : 'en';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  // The saved choice (store/preferences.ts) replaces this at startup.
  lng: deviceLanguage(),
  // Fall back within a script the reader knows: Marathi readers read Hindi.
  fallbackLng: { mr: ['hi', 'en'], default: ['en'] },
  interpolation: { escapeValue: false },
});

export default i18n;
