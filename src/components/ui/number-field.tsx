import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { Text } from './text';

type NumberFieldProps = {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  /** Size of one − / + tap. */
  step?: number;
  /** Allow decimals (kg, litres). */
  decimal?: boolean;
  unit?: string;
  error?: string;
  hint?: string;
  testID?: string;
};

function parse(text: string, decimal: boolean): number | undefined {
  const cleaned = text.replace(/,/g, '').trim();
  if (cleaned === '') return undefined;
  const n = decimal ? Number.parseFloat(cleaned) : Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** A number with big − and + buttons: easy with wet or gloved hands, no typing needed. */
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  decimal = false,
  unit,
  error,
  hint,
  testID,
}: NumberFieldProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const [lastValue, setLastValue] = useState(value);

  // Follow outside changes (steppers, form reset) without fighting the user's typing.
  if (value !== lastValue) {
    setLastValue(value);
    if (parse(text, decimal) !== value) setText(value === undefined ? '' : String(value));
  }

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min, n));
  const bump = (delta: number) => {
    const next = clamp(Number(((value ?? 0) + delta).toFixed(decimal ? 2 : 0)));
    onChange(next);
  };

  const borderColor = error ? colors.danger : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text variant="label">{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => bump(-step)}
          accessibilityRole="button"
          accessibilityLabel={`${label} −${step}`}
          style={({ pressed }) => [
            styles.stepper,
            { borderColor, backgroundColor: pressed ? colors.primarySoft : colors.card },
          ]}>
          <Icon name="minus" size={26} color={colors.primary} />
        </Pressable>
        <View style={[styles.box, { borderColor, backgroundColor: colors.card }]}>
          <TextInput
            testID={testID}
            value={text}
            onChangeText={(t) => {
              setText(t);
              onChange(parse(t, decimal));
            }}
            keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
            accessibilityLabel={label}
            selectTextOnFocus
            style={[styles.input, { color: colors.text }]}
          />
          {!!unit && (
            <Text variant="caption" tone="muted">
              {unit}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => bump(step)}
          accessibilityRole="button"
          accessibilityLabel={`${label} +${step}`}
          style={({ pressed }) => [
            styles.stepper,
            { borderColor, backgroundColor: pressed ? colors.primarySoft : colors.card },
          ]}>
          <Icon name="plus" size={26} color={colors.primary} />
        </Pressable>
      </View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepper: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    height: touch.min,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    gap: space.xs,
  },
  input: { flex: 1, minWidth: 0, fontSize: 22, fontWeight: '600', textAlign: 'center', fontVariant: ['tabular-nums'] },
});
