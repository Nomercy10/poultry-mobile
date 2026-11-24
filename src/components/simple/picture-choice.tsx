import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { tapFeedback } from '@/lib/haptics';
import { speak } from '@/lib/voice';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export type Choice<T extends string> = { value: T; label: string; icon: IconName; detail?: string };

type PictureChoiceProps<T extends string> = {
  choices: Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** One choice per row (batches, feeds) instead of a 2-column grid (causes). */
  list?: boolean;
};

/** Big picture buttons. Tapping one selects it and says its name. */
export function PictureChoice<T extends string>({ choices, value, onChange, list = false }: PictureChoiceProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.grid, list && styles.list]} accessibilityRole="radiogroup">
      {choices.map((c) => {
        const selected = c.value === value;
        return (
          <Pressable
            key={c.value}
            onPress={() => {
              tapFeedback();
              onChange(c.value);
              speak(c.label);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={c.detail ? `${c.label}, ${c.detail}` : c.label}
            style={[
              list ? styles.row : styles.cell,
              {
                borderColor: selected ? colors.primary : colors.border,
                borderWidth: selected ? 3 : 1,
                backgroundColor: selected ? colors.primarySoft : colors.card,
              },
            ]}>
            <Icon name={c.icon} size={list ? 36 : 44} color={colors.primary} />
            <View style={list ? styles.rowText : styles.cellText}>
              <Text variant="heading" style={!list && styles.center} numberOfLines={2}>
                {c.label}
              </Text>
              {!!c.detail && (
                <Text variant="caption" tone="muted" style={!list && styles.center}>
                  {c.detail}
                </Text>
              )}
            </View>
            {selected && <Icon name="check-circle" size={28} color={colors.primary} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  list: { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' },
  cell: { flexBasis: '46%', flexGrow: 1, minHeight: 132, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md },
  cellText: { alignItems: 'center' },
  row: { width: '100%', minHeight: 84, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  rowText: { flex: 1, gap: 2 },
  center: { textAlign: 'center' },
});
