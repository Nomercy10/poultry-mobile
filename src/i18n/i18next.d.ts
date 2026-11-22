import 'i18next';

import type en from './en.json';

// Type-checked translation keys: t('home.todaysEggs') compiles, t('home.typo') doesn't.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
