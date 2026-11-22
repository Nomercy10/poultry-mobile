import { StyleSheet, View } from 'react-native';

import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Card } from './card';
import { Icon, type IconName } from './icon';
import { Text, type TextTone } from './text';

type KpiCardProps = {
  label: string;
  value: string;
  icon: IconName;
  tone?: Extract<TextTone, 'default' | 'success' | 'warning' | 'danger'>;
  loading?: boolean;
};

export function KpiCard({ label, value, icon, tone = 'default', loading = false }: KpiCardProps) {
  const { colors } = useTheme();
  const accent = {
    default: { fg: colors.primary, bg: colors.primarySoft },
    success: { fg: colors.success, bg: colors.successSoft },
    warning: { fg: colors.warning, bg: colors.warningSoft },
    danger: { fg: colors.danger, bg: colors.dangerSoft },
  }[tone];

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
        <Icon name={icon} size={20} color={accent.fg} />
      </View>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
      {loading ? (
        <View style={[styles.skeleton, { backgroundColor: colors.border }]} />
      ) : (
        <Text variant="display" numeric numberOfLines={1} adjustsFontSizeToFit accessibilityLabel={`${label}: ${value}`}>
          {value}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, gap: space.xs },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  skeleton: { height: 28, width: '70%', borderRadius: radius.sm, opacity: 0.6 },
});
