import { create } from 'zustand';

import i18n from '@/i18n';
import { isLanguageCode, type LanguageCode } from '@/i18n/languages';
import { secureStorage } from '@/lib/secure-storage';

export type UiMode = 'simple' | 'standard';

const KEY = 'poultry.preferences';

/** App style per user id, so a shared phone keeps each person's choice. */
type UiModes = Record<string, UiMode>;
type Saved = { language: LanguageCode | null; uiModes: UiModes; voice: boolean };

type PreferencesState = Saved & {
  loaded: boolean;
  load: () => Promise<void>;
  setLanguage: (language: LanguageCode) => void;
  /** null = follow the default for the user's role. */
  setUiMode: (userId: string, uiMode: UiMode | null) => void;
  setVoice: (voice: boolean) => void;
};

// Per phone for now. The backend gets preferredLanguage and uiMode on the user
// later, so an owner can set them for a worker (docs/languages-and-easy-ui.md §1.5).
export const usePreferences = create<PreferencesState>()((set, get) => {
  const persist = () => {
    const { language, uiModes, voice } = get();
    void secureStorage.set(KEY, JSON.stringify({ language, uiModes, voice } satisfies Saved));
  };

  return {
    language: null,
    uiModes: {},
    voice: true,
    loaded: false,

    load: async () => {
      try {
        const raw = await secureStorage.get(KEY);
        const saved = raw ? (JSON.parse(raw) as Partial<Saved>) : {};
        const language = isLanguageCode(saved.language) ? saved.language : null;
        const uiModes: UiModes = {};
        for (const [id, mode] of Object.entries(saved.uiModes ?? {})) {
          if (mode === 'simple' || mode === 'standard') uiModes[id] = mode;
        }
        set({ language, uiModes, voice: saved.voice !== false, loaded: true });
        if (language) await i18n.changeLanguage(language);
      } catch {
        set({ loaded: true });
      }
    },

    setLanguage: (language) => {
      set({ language });
      void i18n.changeLanguage(language);
      persist();
    },
    setUiMode: (userId, uiMode) => {
      const uiModes = { ...get().uiModes };
      if (uiMode) uiModes[userId] = uiMode;
      else delete uiModes[userId];
      set({ uiModes });
      persist();
    },
    setVoice: (voice) => {
      set({ voice });
      persist();
    },
  };
});
