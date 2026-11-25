import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { addMonths, isSameMonth } from '@/features/money/model';
import { languageInfo } from '@/i18n/languages';
import { radius, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './icon';
import { Text } from './text';

type MonthStepperProps = {
  value: Date;
  onChange: (month: Date) => void;
  /** Earliest month that can be shown (plan history), or null. */
  min?: Date | null;
};

/** ‹ November 2026 › — month names in the app language, Western digits. */
export function MonthStepper({ value, onChange, min }: MonthStepperProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const atMax = isSameMonth(value, new Date()) || value > new Date();
  const atMin = !!min && (isSameMonth(value, min) || value < min);
  const locale = `${languageInfo(i18n.language).locale}-u-nu-latn`;
  const text = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(value);

  return (
    <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Pressable
        onPress={() => onChange(addMonths(value, -1))}
        disabled={atMin}
        accessibilityRole="button"
        accessibilityLabel={t('money.previousMonth')}
        accessibilityState={{ disabled: atMin }}
        style={[styles.arrow, atMin && styles.disabled]}>
        <Icon name="chevron-left" size={28} color={colors.primary} />
      </Pressable>
      <Text variant="heading" style={styles.text} accessibilityLiveRegion="polite">
        {text}
      </Text>
      <Pressable
        onPress={() => onChange(addMonths(value, 1))}
        disabled={atMax}
        accessibilityRole="button"
        accessibilityLabel={t('money.nextMonth')}
        accessibilityState={{ disabled: atMax }}
        style={[styles.arrow, atMax && styles.disabled]}>
        <Icon name="chevron-right" size={28} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, minHeight: touch.min },
  arrow: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
  text: { flex: 1, textAlign: 'center' },
});

