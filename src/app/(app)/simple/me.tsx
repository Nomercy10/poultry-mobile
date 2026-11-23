import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LanguageGrid } from '@/components/language-grid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormHeader } from '@/components/ui/form-header';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/store/auth';
import { usePreferences } from '@/store/preferences';

/** Simple mode's settings: language, voice, the detailed app, log out. No pop-up dialogs. */
export default function SimpleMe() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const voice = usePreferences((s) => s.voice);
  const setVoice = usePreferences((s) => s.setVoice);
  const setUiMode = usePreferences((s) => s.setUiMode);

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={t('simple.me.title')} subtitle={user?.name} />

      <Text variant="heading">{t('settings.language')}</Text>
      <LanguageGrid />

      <Text variant="heading">{t('settings.voice')}</Text>
      <SegmentedControl<'on' | 'off'>
        value={voice ? 'on' : 'off'}
        onChange={(v) => setVoice(v === 'on')}
        options={[
          { value: 'on', label: t('settings.voiceOn') },
          { value: 'off', label: t('settings.voiceOff') },
        ]}
      />

      <Section>
        <ListRow
          icon="view-dashboard-outline"
          title={t('simple.me.detailed')}
          subtitle={t('simple.me.detailedHint')}
          onPress={() => {
            if (user) setUiMode(user.id, 'standard');
            router.replace('/');
          }}
          testID="open-detailed"
        />
      </Section>

      <Card>
        <Button label={t('simple.me.logout')} icon="logout" variant="danger" onPress={() => void signOut()} testID="simple-logout" />
      </Card>
    </Screen>
  );
}
