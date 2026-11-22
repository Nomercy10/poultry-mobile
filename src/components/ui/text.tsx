import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type TypeVariant, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export type TextTone = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger' | 'onPrimary';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  /** Tabular figures so numbers line up in cards and lists. */
  numeric?: boolean;
};

export function Text({ variant = 'body', tone = 'default', numeric, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
  }[tone];

  return (
    <RNText
      style={[typeScale[variant], { color }, numeric && { fontVariant: ['tabular-nums'] }, style]}
      {...rest}
    />
  );
}
