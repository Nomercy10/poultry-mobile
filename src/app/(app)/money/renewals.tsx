import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FormHeader } from '@/components/ui/form-header';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useRenewals } from '@/features/money/api';
import { RENEWAL_ICONS } from '@/features/money/icons';
import { daysUntil, FREE_RENEWALS, groupRenewals, type Renewal, type RenewalState } from '@/features/money/renewals';
import { hasFeature } from '@/features/plans/catalog';
import { LockedFeature } from '@/features/plans/locked-feature';
import { usePlan } from '@/features/plans/use-plan';
import { isApiError } from '@/lib/api/errors';
import { errorMessage } from '@/lib/api/messages';
import { formatDay } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/use-theme';

const ORDER: RenewalState[] = ['overdue', 'dueSoon', 'later'];

/** Licences, insurance, loan EMIs and other dates not to miss. Free keeps 3. */
export default function RenewalsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const { filterFarmId } = useWorkingFarm();
  const renewals = useRenewals(filterFarmId);
  const list = renewals.data ?? [];
  const groups = groupRenewals(list);
  const unlimited = hasFeature(plan, 'renewalsUnlimited');
  const atLimit = !unlimited && list.length >= FREE_RENEWALS;
  const notOnServer = isApiError(renewals.error) && renewals.error.status === 404;

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={t('insights.renewals.title')} right={<FarmSwitcher />} />
      <Text tone="muted">{t('insights.renewals.intro')}</Text>
      {notOnServer ? (
        <Banner tone="info" message={t('insights.renewals.serverUpdate')} />
      ) : renewals.isError ? (
        <Banner message={errorMessage(renewals.error, t)} actionLabel={t('common.retry')} onAction={() => void renewals.refetch()} />
      ) : null}
      {!notOnServer && can(user, 'RENEWAL', 'CREATE') && !atLimit && (
        <Button label={t('insights.renewals.add')} icon="plus" onPress={() => router.push('/money/renewal')} testID="add-renewal" />
      )}
      {!notOnServer && atLimit && (
        <>
          <Text variant="caption" tone="muted">
            {t('insights.renewals.freeLimit', { count: FREE_RENEWALS })}
          </Text>
          <LockedFeature feature="renewalsUnlimited" />
        </>
      )}
      {renewals.isPending && can(user, 'RENEWAL') ? (
        <ActivityIndicator color={colors.primary} />
      ) : list.length === 0 && !renewals.isError ? (
        <EmptyState icon="calendar-check-outline" title={t('insights.renewals.empty')} message={t('insights.renewals.emptyHint')} />
      ) : (
        ORDER.map((state) => (
          <Section key={state} title={t(`insights.renewals.group.${state}`)}>
            {groups[state].map((r) => (
              <RenewalRow key={r.id} renewal={r} state={state} />
            ))}
          </Section>
        ))
      )}
    </Screen>
  );
}

function RenewalRow({ renewal: r, state }: { renewal: Renewal; state: RenewalState }) {
  const { t } = useTranslation();
  const days = daysUntil(r.dueDate);
  const when =
    days < 0
      ? t('insights.renewals.overdueBy', { count: -days })
      : days === 0
        ? t('insights.renewals.dueToday')
        : t('insights.renewals.dueIn', { count: days });
  return (
    <ListRow
      icon={RENEWAL_ICONS[r.kind]}
      title={r.title}
      subtitle={[formatDay(r.dueDate), r.repeatMonths ? t(`insights.renewals.repeat.${r.repeatMonths}`, { defaultValue: '' }) : null]
        .filter(Boolean)
        .join(' · ')}
      value={r.amount ? formatCurrency(r.amount) : undefined}
      badge={state === 'later' ? undefined : when}
      badgeTone={state === 'overdue' ? 'danger' : 'warning'}
      onPress={() => router.push({ pathname: '/money/renewal', params: { id: r.id } })}
      testID={`renewal-${r.id}`}
    />
  );
}
