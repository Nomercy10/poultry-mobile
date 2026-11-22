// Design tokens. Colours are converted from the web app's globals.css HSL
// tokens so both products share one brand (see docs/mobile-app-plan.md).

export const palette = {
  light: {
    primary: '#DB7706',
    onPrimary: '#FFFFFF',
    primarySoft: '#FCEBD6',
    background: '#FCFAF8',
    card: '#FFFFFF',
    text: '#231D1A',
    textMuted: '#7A726C',
    border: '#E3DED9',
    success: '#1A9948',
    successSoft: '#DDF3E5',
    warning: '#F59F0A',
    warningSoft: '#FDF0D5',
    danger: '#DC2828',
    dangerSoft: '#FBE1E1',
    overlay: 'rgba(35, 29, 26, 0.45)',
  },
  dark: {
    primary: '#F39120',
    onPrimary: '#171312',
    primarySoft: '#3D2810',
    background: '#171312',
    card: '#201B18',
    text: '#F7F5F3',
    textMuted: '#A49D98',
    border: '#38312E',
    success: '#2EB860',
    successSoft: '#163823',
    warning: '#EEA62B',
    warningSoft: '#3B2C10',
    danger: '#CF3030',
    dangerSoft: '#3D1616',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

/** 4 dp grid. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
  fab: 28,
} as const;

/** Minimum touch target for gloved / wet hands. */
export const touch = {
  min: 56,
  compact: 44,
} as const;

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
} as const;

export type TypeVariant = keyof typeof type;
