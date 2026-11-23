import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, formatDay, isSameLocalDay, relativeDay } from '@/lib/dates';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { Text } from './text';

type DateStepperProps = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  /** Latest day allowed (default today): records can't be in the future. */
  max?: Date | null;
};

/** ‹ Today › — picks a day by tapping, which suits daily farm records better than a calendar. */
export function DateStepper({ label, value, onChange, max = new Date() }: DateStepperProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const rel = relativeDay(value);
  const atMax = !!max && (isSameLocalDay(value, max) || value > max);
  const text = rel ? `${t(`common.${rel}`)} · ${formatDay(value)}` : formatDay(value);

  return (
    <View style={styles.wrapper}>
      <Text variant="label">{label}</Text>
      <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => onChange(addDays(value, -1))}
          accessibilityRole="button"
          accessibilityLabel={t('common.previousDay')}
          style={styles.arrow}>
          <Icon name="chevron-left" size={28} color={colors.primary} />
        </Pressable>
        <Text variant="heading" style={styles.text} accessibilityLiveRegion="polite">
          {text}
        </Text>
        <Pressable
          onPress={() => onChange(addDays(value, 1))}
          disabled={atMax}
          accessibilityRole="button"
          accessibilityLabel={t('common.nextDay')}
          accessibilityState={{ disabled: atMax }}
          style={[styles.arrow, atMax && styles.disabled]}>
          <Icon name="chevron-right" size={28} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: touch.min,
  },
  arrow: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
  text: { flex: 1, textAlign: 'center' },
});
