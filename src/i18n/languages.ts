// Languages the app ships, in picker order after the device's own language.
// Names are hard-coded in their own script (endonyms) so a reader always finds
// their language, whatever language the screen is in. Phase 1 adds Telugu and
// Tamil next (docs/languages-and-easy-ui.md).

export type LanguageCode = 'en' | 'hi' | 'mr';

export type LanguageInfo = {
  code: LanguageCode;
  /** The language's name in its own script. */
  endonym: string;
  /** English name, shown small under the endonym. */
  english: string;
  /** Locale for dates and text-to-speech. Digits are always Western (0–9). */
  locale: string;
};

export const LANGUAGES: readonly LanguageInfo[] = [
  { code: 'hi', endonym: 'हिन्दी', english: 'Hindi', locale: 'hi-IN' },
  { code: 'mr', endonym: 'मराठी', english: 'Marathi', locale: 'mr-IN' },
  { code: 'en', endonym: 'English', english: 'English', locale: 'en-IN' },
];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

export function languageInfo(code: string): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[LANGUAGES.length - 1];
}

/** Picker order: the device language first, then the rest. */
export function pickerOrder(deviceCode: string | null | undefined): LanguageInfo[] {
  const first = LANGUAGES.find((l) => l.code === deviceCode);
  return first ? [first, ...LANGUAGES.filter((l) => l !== first)] : [...LANGUAGES];
}
