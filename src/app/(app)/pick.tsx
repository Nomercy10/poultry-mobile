import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { FormHeader } from '@/components/ui/form-header';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { type EventType, isActive, useBatches } from '@/features/chickens/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useFeedItems } from '@/features/feed/api';
import { errorMessage } from '@/lib/api/messages';
import { formatDay } from '@/lib/dates';
import { formatNumber } from '@/lib/format';

/** Batch events reachable from Quick add. */
const BATCH_TARGETS: Record<string, EventType> = {
  mortality: 'MORTALITY',
  weight: 'WEIGHT_CHECK',
  medicine: 'MEDICINE',
  vaccination: 'VACCINATION',
};

/** "Which batch?" / "Which feed?" step for Quick add. Skipped when there is only one choice. */
export default function PickScreen() {
  const { for: target = '' } = useLocalSearchParams<{ for?: string }>();
  return target === 'feedUsed' ? <PickFeed /> : <PickBatch eventType={BATCH_TARGETS[target] ?? 'NOTE'} />;
}

function PickBatch({ eventType }: { eventType: EventType }) {
  const { t } = useTranslation();
  const { filterFarmId } = useWorkingFarm();
  const batches = useBatches(filterFarmId);
  const active = (batches.data ?? []).filter(isActive);

  if (active.length === 1) {
    return <Redirect href={{ pathname: '/batches/[id]/event', params: { id: active[0].id, type: eventType } }} />;
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={t('pick.batch')} subtitle={t(`batches.actions.${eventType}`)} />
      {batches.isPending && <ActivityIndicator />}
      {batches.isError && <Banner message={errorMessage(batches.error, t)} actionLabel={t('common.retry')} onAction={() => void batches.refetch()} />}
      {batches.data && active.length === 0 && <EmptyState icon="bird" title={t('pick.noBatches')} />}
      <Section>
        {active.map((b) => (
          <ListRow
            key={b.id}
            icon="bird"
            title={b.batchNumber}
            subtitle={b.breed}
            value={formatNumber(b.currentCount)}
            onPress={() => router.replace({ pathname: '/batches/[id]/event', params: { id: b.id, type: eventType } })}
          />
        ))}
      </Section>
    </Screen>
  );
}

function PickFeed() {
  const { t } = useTranslation();
  const { filterFarmId } = useWorkingFarm();
  const feed = useFeedItems(filterFarmId);
  const inStock = (feed.data ?? []).filter((f) => f.currentQuantity > 0);

  if (inStock.length === 1) {
    return <Redirect href={{ pathname: '/feed/[id]/use', params: { id: inStock[0].id } }} />;
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={t('pick.feed')} />
      {feed.isPending && <ActivityIndicator />}
      {feed.isError && <Banner message={errorMessage(feed.error, t)} actionLabel={t('common.retry')} onAction={() => void feed.refetch()} />}
      {feed.data && inStock.length === 0 && <EmptyState icon="grain" title={t('pick.noFeed')} />}
      <Section>
        {inStock.map((f) => (
          <ListRow
            key={f.id}
            icon="grain"
            title={f.feedType}
            subtitle={t('feed.boughtOn', { date: formatDay(f.purchaseDate) })}
            value={`${formatNumber(f.currentQuantity)} ${t(`feed.units.${f.unit}`)}`}
            onPress={() => router.replace({ pathname: '/feed/[id]/use', params: { id: f.id } })}
          />
        ))}
      </Section>
    </Screen>
  );
}
