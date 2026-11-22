import { DarkTheme, DefaultTheme, type Theme as NavTheme } from 'expo-router';

import { palette, type ColorScheme } from './tokens';

/** Expo Router / React Navigation theme built from our tokens. */
export function navigationTheme(scheme: ColorScheme): NavTheme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = palette[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.border,
      notification: c.danger,
    },
  };
}
