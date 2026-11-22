import { useColorScheme } from 'react-native';

import { palette, type ColorScheme, type ThemeColors } from './tokens';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
};

/** Follows the system light / dark setting. */
export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palette[scheme] };
}
