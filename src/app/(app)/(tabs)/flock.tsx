import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { can } from '@/features/auth/permissions';
import { ageInDays, type Batch, isActive, useBatches } from '@/features/chickens/api';
import { STATUS_TONE } from '@/features/chickens/status';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { canAddBatch } from '@/features/plans/catalog';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';

export default function FlockScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const { filterFarmId } = useWorkingFarm();
  const batches = useBatches(filterFarmId);
  const all = batches.data ?? [];
  const active = all.filter(isActive);
  const closed = all.filter((b) => !isActive(b));
  const atLimit = !canAddBatch(plan, active.length);

  const row = (b: Batch) => (
    <ListRow
      key={b.id}
      icon="bird"
      title={b.batchNumber}
      subtitle={t('batches.rowSummary', { breed: b.breed, count: ageInDays(b) })}
      value={formatNumber(b.currentCount)}
      // Healthy is the norm; only call out the exceptions.
      badge={b.status === 'HEALTHY' ? undefined : t(`batches.status.${b.status}`)}
      badgeTone={STATUS_TONE[b.status]}
      onPress={() => router.push({ pathname: '/batches/[id]', params: { id: b.id } })}
    />
  );

  return (
    <Screen refreshing={batches.isRefetching} onRefresh={() => void batches.refetch()}>
      <ScreenHeader title={t('flock.title')} right={<FarmSwitcher />} />

      {can(user, 'CHICKEN', 'CREATE') &&
        (atLimit ? (
          <Banner
            tone="info"
            message={t('plans.limitBatches', { count: plan.limits.activeBatches })}
            actionLabel={t('plans.seePlans')}
            onAction={() => router.push('/plans')}
          />
        ) : (
          <Button label={t('batches.new')} icon="plus" variant="secondary" onPress={() => router.push('/batches/new')} />
        ))}

      {batches.isError && (
        <Banner message={errorMessage(batches.error, t)} actionLabel={t('common.retry')} onAction={() => void batches.refetch()} />
      )}
      {batches.isPending ? (
        <ActivityIndicator />
      ) : all.length === 0 ? (
        <EmptyState icon="bird" title={t('batches.emptyTitle')} message={t('batches.emptyMessage')} />
      ) : (
        <>
          <Section title={t('batches.active', { n: active.length })}>{active.map(row)}</Section>
          <Section title={t('batches.closed')}>{closed.map(row)}</Section>
        </>
      )}
    </Screen>
  );
}
