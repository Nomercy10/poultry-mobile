import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { Text } from './text';

type BannerProps = {
  tone?: 'danger' | 'warning' | 'info';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Inline message, e.g. a failed request with a Retry action. */
export function Banner({ tone = 'danger', message, actionLabel, onAction }: BannerProps) {
  const { colors } = useTheme();
  const look = {
    danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle-outline' as const },
    warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'alert-outline' as const },
    info: { bg: colors.primarySoft, fg: colors.primary, icon: 'information-outline' as const },
  }[tone];

  return (
    <View
      style={[styles.banner, { backgroundColor: look.bg }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <Icon name={look.icon} size={22} color={look.fg} />
      <Text variant="caption" style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text variant="label" style={{ color: look.fg }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
  },
  message: { flex: 1 },
});
