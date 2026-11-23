import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import i18n from '@/i18n';
import { type LanguageCode, pickerOrder } from '@/i18n/languages';
import { tapFeedback } from '@/lib/haptics';
import { speak } from '@/lib/voice';
import { usePreferences } from '@/store/preferences';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/**
 * Each language written in its own script, with its English name small below.
 * Tapping one switches the app at once and says a short sample in that language,
 * so someone who can't read can tap and listen until they hear their own.
 */
export function LanguageGrid({ onChosen }: { onChosen?: (code: LanguageCode) => void }) {
  const { colors } = useTheme();
  const { i18n: active } = useTranslation();
  const setLanguage = usePreferences((s) => s.setLanguage);
  const languages = pickerOrder(getLocales()[0]?.languageCode);

  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {languages.map((l) => {
        const selected = active.language === l.code;
        return (
          <Pressable
            key={l.code}
            onPress={() => {
              tapFeedback();
              setLanguage(l.code);
              speak(i18n.t('language.sample', { lng: l.code }), { force: true });
              onChosen?.(l.code);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${l.endonym}, ${l.english}`}
            testID={`language-${l.code}`}
            style={[
              styles.tile,
              {
                borderColor: selected ? colors.primary : colors.border,
                borderWidth: selected ? 3 : 1,
                backgroundColor: selected ? colors.primarySoft : colors.card,
              },
            ]}>
            <Text style={[styles.endonym, { color: colors.text }]}>{l.endonym}</Text>
            <Text variant="caption" tone="muted">
              {l.english}
            </Text>
            <View style={styles.icons}>
              <Icon name="volume-high" size={22} color={colors.primary} />
              {selected && <Icon name="check-circle" size={22} color={colors.primary} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    minHeight: 120,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    padding: space.md,
  },
  endonym: { fontSize: 26, lineHeight: 38, fontWeight: '700' },
  icons: { flexDirection: 'row', gap: space.sm },
});
