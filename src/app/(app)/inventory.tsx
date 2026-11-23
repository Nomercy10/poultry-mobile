import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { FormHeader } from '@/components/ui/form-header';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useInventorySummary } from '@/features/inventory/api';
import { errorMessage } from '@/lib/api/messages';
import { formatNumber } from '@/lib/format';

/** Egg and feed stock with low / out-of-stock alerts (GET /inventory/summary). */
export default function InventoryScreen() {
  const { t } = useTranslation();
  const { filterFarmId } = useWorkingFarm();
  const summary = useInventorySummary(filterFarmId);
  const s = summary.data;
  const unit = (u: string) => (['KG', 'BAG', 'LITRE', 'TON'].includes(u) ? t(`feed.units.${u as 'KG'}`) : u);

  return (
    <Screen edges={['top', 'bottom']} refreshing={summary.isRefetching} onRefresh={() => void summary.refetch()}>
      <FormHeader title={t('more.inventory')} />
      {summary.isPending && <ActivityIndicator />}
      {summary.isError && (
        <Banner message={errorMessage(summary.error, t)} actionLabel={t('common.retry')} onAction={() => void summary.refetch()} />
      )}
      {s && (
        <>
          {s.alerts.outOfStockFeed.length > 0 && (
            <Banner message={t('inventory.outOfStock', { names: s.alerts.outOfStockFeed.map((f) => f.feedType).join(', ') })} />
          )}
          {s.alerts.lowStockFeed.length > 0 && (
            <Banner tone="warning" message={t('inventory.lowStock', { names: s.alerts.lowStockFeed.map((f) => f.feedType).join(', ') })} />
          )}
          <Section title={t('inventory.eggs')}>
            {s.eggStock.length === 0 ? (
              <ListRow title={t('eggs.emptyTitle')} />
            ) : (
              s.eggStock.map((e) => (
                <ListRow key={e.farmId} icon="egg-outline" title={e.farmName} value={formatNumber(e.currentStock)} onPress={() => router.push('/stock')} />
              ))
            )}
          </Section>
          <Section title={t('inventory.feed')}>
            {s.feedStock.length === 0 ? (
              <ListRow title={t('feed.emptyTitle')} />
            ) : (
              s.feedStock.map((f) => (
                <ListRow
                  key={f.id}
                  icon="grain"
                  title={f.feedType}
                  subtitle={f.farmName}
                  value={`${formatNumber(f.currentQuantity)} ${unit(f.unit)}`}
                  badge={f.isOutOfStock ? t('feed.out') : f.isLowStock ? t('feed.low') : undefined}
                  badgeTone={f.isOutOfStock ? 'danger' : 'warning'}
                  onPress={() => router.push({ pathname: '/feed/[id]', params: { id: f.id } })}
                />
              ))
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}
