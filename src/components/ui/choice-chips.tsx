import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type ChipOption<T extends string> = { value: T; label: string; icon?: IconName };

type ChoiceChipsProps<T extends string> = {
  label?: string;
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  testID?: string;
};

/** Wrapping pill buttons for one choice out of many (too many for a segmented control). */
export function ChoiceChips<T extends string>({ label, options, value, onChange, testID }: ChoiceChipsProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper} testID={testID}>
      {!!label && <Text variant="label">{label}</Text>}
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              testID={testID ? `${testID}-${opt.value}` : undefined}
              style={[
                styles.chip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card,
                },
              ]}>
              {opt.icon && <Icon name={opt.icon} size={20} color={selected ? colors.primary : colors.textMuted} />}
              <Text variant="label" tone={selected ? 'primary' : 'default'}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: touch.compact,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
