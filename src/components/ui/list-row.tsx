import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Badge } from './badge';
import { Icon, type IconName } from './icon';
import { Text } from './text';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  /** Small pill on the right, e.g. "Soon" or a status. */
  badge?: string;
  destructive?: boolean;
  testID?: string;
};

export function ListRow({ title, subtitle, icon, onPress, badge, destructive, testID }: ListRowProps) {
  const { colors } = useTheme();
  const fg = destructive ? colors.danger : colors.text;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.background }]}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft }]}>
          <Icon name={icon} size={20} color={destructive ? colors.danger : colors.primary} />
        </View>
      )}
      <View style={styles.text}>
        <Text variant="body" style={{ color: fg, fontWeight: '500' }}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {badge && <Badge label={badge} />}
      {onPress && !badge && <Icon name="chevron-right" color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
});
