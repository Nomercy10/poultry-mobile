import Constants from 'expo-constants';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { type MoreItemKey, moreSections } from '@/features/navigation/menu';
import { usePlan } from '@/features/plans/use-plan';
import { useUiMode } from '@/features/settings/use-ui-mode';
import { languageInfo } from '@/i18n/languages';
import { confirm } from '@/lib/confirm';
import { useAuth } from '@/store/auth';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Screens that exist so far; the rest show "Soon". */
const MORE_ROUTES: Partial<Record<MoreItemKey, Href>> = {
  inventory: '/inventory',
  revenue: { pathname: '/money', params: { tab: 'sales' } },
  expenses: { pathname: '/money', params: { tab: 'expenses' } },
  outstanding: { pathname: '/money', params: { tab: 'dues' } },
  customers: { pathname: '/money/people', params: { kind: 'customers' } },
  suppliers: { pathname: '/money/people', params: { kind: 'suppliers' } },
};

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const mode = useUiMode();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [signingOut, setSigningOut] = useState(false);

  const plan = usePlan();
  const sections = moreSections(user);
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function onLogout() {
    const ok = await confirm(t('auth.logoutConfirm'), t('auth.logout'), t('common.cancel'));
    if (!ok) return;
    setSigningOut(true);
    await signOut();
  }

  return (
    <Screen>
      <ScreenHeader title={t('more.title')} />

      <Card style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text variant="heading" tone="primary">
            {initials}
          </Text>
        </View>
        <View style={styles.profileText}>
          <Text variant="heading" numberOfLines={1}>
            {user?.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
        {user && <Badge label={user.role} tone="primary" />}
      </Card>

      <Section>
        <ListRow
          title={t('plans.yourPlan')}
          subtitle={t(`plans.${plan.id}`)}
          icon="star-circle-outline"
          onPress={() => router.push('/plans')}
          testID="your-plan"
        />
        <ListRow
          title={t('settings.language')}
          subtitle={languageInfo(i18n.language).endonym}
          icon="translate"
          onPress={() => router.push('/settings')}
          testID="settings-language"
        />
      </Section>

      {sections.map((section) => (
        <Section key={section.key} title={t(`more.${section.key}`)}>
          {section.items.map((item) => {
            const href = MORE_ROUTES[item.key];
            return (
              <ListRow
                key={item.key}
                title={t(`more.${item.key}`)}
                icon={item.icon}
                badge={href ? undefined : t('common.soon')}
                onPress={href ? () => router.push(href) : undefined}
                testID={`more-${item.key}`}
              />
            );
          })}
        </Section>
      ))}

      <Section title={t('more.account')}>
        <ListRow
          title={t('settings.appStyle')}
          subtitle={mode === 'simple' ? t('settings.simple') : t('settings.standard')}
          icon="view-grid-outline"
          onPress={() => router.push('/settings')}
        />
        <ListRow title={t('more.changePassword')} icon="lock-reset" badge={t('common.soon')} />
        <ListRow
          title={signingOut ? `${t('auth.logout')}…` : t('auth.logout')}
          icon="logout"
          destructive
          onPress={signingOut ? undefined : onLogout}
          testID="logout"
        />
      </Section>

      <Text variant="caption" tone="muted" style={styles.version}>
        {t('more.version', { version: Constants.expoConfig?.version ?? '—' })}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1, gap: 2 },
  version: { textAlign: 'center' },
});
