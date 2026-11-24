import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { tapFeedback } from '@/lib/haptics';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type BigCounterProps = {
  label: string;
  icon?: IconName;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimal?: boolean;
  testID?: string;
};

/** Huge − / + buttons around a big number. The number can also be typed. */
export function BigCounter({ label, icon, value, onChange, min = 0, max, step = 1, decimal = false, testID }: BigCounterProps) {
  const { colors } = useTheme();
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min, n));
  const bump = (delta: number) => {
    tapFeedback();
    onChange(clamp(Number((value + delta).toFixed(decimal ? 1 : 0))));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        {icon && <Icon name={icon} size={24} color={colors.primary} />}
        <Text variant="heading">{label}</Text>
      </View>
      <View style={styles.row}>
        <Step icon="minus" label={`${label} −`} onPress={() => bump(-step)} disabled={value <= min} />
        <TextInput
          testID={testID}
          value={String(value)}
          onChangeText={(text) => {
            const n = decimal ? Number.parseFloat(text) : Number.parseInt(text.replace(/\D/g, ''), 10);
            onChange(clamp(Number.isFinite(n) ? n : 0));
          }}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          accessibilityLabel={label}
          style={[styles.value, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        />
        <Step icon="plus" label={`${label} +`} onPress={() => bump(step)} disabled={max !== undefined && value >= max} />
      </View>
    </View>
  );
}

function Step({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: pressed ? colors.primary : colors.primarySoft, opacity: disabled ? 0.4 : 1 },
      ]}>
      <Icon name={icon} size={36} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  step: { width: 76, height: 76, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  value: {
    flex: 1,
    minWidth: 0,
    height: 76,
    borderWidth: 1,
    borderRadius: radius.lg,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
