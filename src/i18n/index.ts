import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';

// Marathi (mr) and Hindi (hi) are added here in stage 2; screens already use t().
export const resources = {
  en: { translation: en },
} as const;

export type AppLanguage = keyof typeof resources;

function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code in resources ? (code as AppLanguage) : 'en';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
