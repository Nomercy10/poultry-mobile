import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { tapFeedback } from '@/lib/haptics';
import { speak } from '@/lib/voice';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type BigTileProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
  /** e.g. "235" once done today. */
  status?: string;
  /** Today's state; leave out for tiles that aren't daily tasks (deaths, Me). */
  done?: boolean;
  tint?: 'primary' | 'danger';
  testID?: string;
};

/** A large picture tile for Simple mode. Hold it to hear its name. */
export function BigTile({ label, icon, onPress, status, done, tint = 'primary', testID }: BigTileProps) {
  const { colors } = useTheme();
  const fg = tint === 'danger' ? colors.danger : colors.primary;
  const bg = tint === 'danger' ? colors.dangerSoft : colors.primarySoft;

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      onLongPress={() => speak(label, { force: true })}
      accessibilityRole="button"
      accessibilityLabel={status ? `${label}, ${status}` : label}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.card, borderColor: done ? colors.success : colors.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Icon name={icon} size={48} color={fg} />
      </View>
      <Text variant="heading" style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.status}>
        {done !== undefined && (
          <Icon name={done ? 'check-circle' : 'circle-outline'} size={22} color={done ? colors.success : colors.textMuted} />
        )}
        {!!status && (
          <Text variant="label" numeric tone={done ? 'success' : 'muted'}>
            {status}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 168,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconWrap: { width: 84, height: 84, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 22 },
});
