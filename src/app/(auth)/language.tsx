import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { LanguageGrid } from '@/components/language-grid';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { usePreferences } from '@/store/preferences';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** First screen on a new phone: tap a language to hear it, then the big tick. */
export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const setLanguage = usePreferences((s) => s.setLanguage);

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.header}>
        <Icon name="translate" size={56} color={colors.primary} />
        <Text variant="title" style={styles.center} accessibilityRole="header">
          {t('language.choose')}
        </Text>
      </View>
      <LanguageGrid />
      <Button
        label={t('common.continue')}
        icon="check-bold"
        onPress={() => {
          // Saves the language even if the user kept the pre-selected one.
          setLanguage(i18n.language as 'en' | 'hi' | 'mr');
          router.replace('/login');
        }}
        testID="language-continue"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: space.xl },
  header: { alignItems: 'center', gap: space.md },
  center: { textAlign: 'center' },
});
