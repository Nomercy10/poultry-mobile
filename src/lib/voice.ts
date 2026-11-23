import * as Speech from 'expo-speech';

import i18n from '@/i18n';
import { languageInfo } from '@/i18n/languages';
import { usePreferences } from '@/store/preferences';

// Text-to-speech for Simple mode prompts, in the app's language.
// Recorded native-speaker prompts replace this for fixed phrases before launch
// (docs/languages-and-easy-ui.md §1.4, §5.5); TTS stays for numbers and names.

/** Speak now, if voice prompts are on. `force` speaks even when they're off (the 🔊 button). */
export function speak(text: string, { force = false }: { force?: boolean } = {}) {
  if (!text || (!force && !usePreferences.getState().voice)) return;
  void Speech.stop();
  Speech.speak(text, { language: languageInfo(i18n.language).locale, rate: 0.9 });
}

export function stopSpeaking() {
  void Speech.stop();
}
