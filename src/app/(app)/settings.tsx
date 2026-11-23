import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { LanguageGrid } from '@/components/language-grid';
import { FormHeader } from '@/components/ui/form-header';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useUiMode } from '@/features/settings/use-ui-mode';
import { useAuth } from '@/store/auth';
import { type UiMode, usePreferences } from '@/store/preferences';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Language, app style (Simple or Detailed) and voice prompts. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const mode = useUiMode();
  const userId = useAuth((s) => s.user?.id);
  const setUiMode = usePreferences((s) => s.setUiMode);
  const voice = usePreferences((s) => s.voice);
  const setVoice = usePreferences((s) => s.setVoice);

  const choose = (next: UiMode) => {
    if (userId) setUiMode(userId, next);
    if (next !== mode) router.replace(next === 'simple' ? '/simple' : '/');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={t('more.account')} />

      <Text variant="heading">{t('settings.language')}</Text>
      <LanguageGrid />

      <Text variant="heading">{t('settings.appStyle')}</Text>
      <View style={styles.styles}>
        <StyleCard icon="view-grid-outline" title={t('settings.simple')} hint={t('settings.simpleHint')} selected={mode === 'simple'} onPress={() => choose('simple')} testID="style-simple" />
        <StyleCard icon="view-dashboard-outline" title={t('settings.standard')} hint={t('settings.standardHint')} selected={mode === 'standard'} onPress={() => choose('standard')} testID="style-standard" />
      </View>

      <Text variant="heading">{t('settings.voice')}</Text>
      <SegmentedControl<'on' | 'off'>
        value={voice ? 'on' : 'off'}
        onChange={(v) => setVoice(v === 'on')}
        options={[
          { value: 'on', label: t('settings.voiceOn') },
          { value: 'off', label: t('settings.voiceOff') },
        ]}
      />
    </Screen>
  );
}

function StyleCard(props: { icon: IconName; title: string; hint: string; selected: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      accessibilityLabel={`${props.title}. ${props.hint}`}
      testID={props.testID}
      style={[
        styles.card,
        {
          borderColor: props.selected ? colors.primary : colors.border,
          borderWidth: props.selected ? 3 : 1,
          backgroundColor: props.selected ? colors.primarySoft : colors.card,
        },
      ]}>
      <Icon name={props.icon} size={40} color={colors.primary} />
      <Text variant="heading">{props.title}</Text>
      <Text variant="caption" tone="muted" style={styles.center}>
        {props.hint}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  styles: { flexDirection: 'row', gap: space.md },
  card: { flex: 1, borderRadius: radius.lg, padding: space.md, alignItems: 'center', gap: space.xs },
  center: { textAlign: 'center' },
});
