import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageGrid } from '@/components/language-grid';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { languageInfo } from '@/i18n/languages';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Globe chip showing the current language; opens the language tiles in a sheet. */
export function LanguageButton() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('language.title')}: ${languageInfo(i18n.language).endonym}`}
        testID="language-button"
        style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Icon name="translate" size={20} color={colors.primary} />
        <Text variant="label">{languageInfo(i18n.language).endonym}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + space.lg }]}
            onPress={() => {}}>
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.header}>
                <Text variant="heading" style={styles.flex} accessibilityRole="header">
                  {t('language.choose')}
                </Text>
                <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={8}>
                  <Icon name="close" color={colors.text} />
                </Pressable>
              </View>
              <LanguageGrid onChosen={() => setTimeout(() => setOpen(false), 600)} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: touch.compact,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, width: '100%', maxWidth: 720, alignSelf: 'center', maxHeight: '85%' },
  content: { padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
});
