import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiCard } from '@/components/ui/kpi-card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { collected, useEggEntries, useEggStock } from '@/features/eggs/api';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { isLowStock, useFeedItems } from '@/features/feed/api';
import { historyStart } from '@/features/plans/catalog';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { formatDay, relativeDay } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Tab = 'eggs' | 'feed';

export default function StockScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const canEggs = can(user, 'EGG');
  const canFeed = can(user, 'FEED');
  const [tab, setTab] = useState<Tab>(canEggs ? 'eggs' : 'feed');

  return (
    <Screen>
      <ScreenHeader title={t('stock.title')} right={<FarmSwitcher />} />
      {canEggs && canFeed && (
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'eggs', label: t('stock.eggs') },
            { value: 'feed', label: t('stock.feed') },
          ]}
        />
      )}
      {tab === 'eggs' && canEggs ? <EggsPanel /> : canFeed ? <FeedPanel /> : null}
    </Screen>
  );
}

function EggsPanel() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const { filterFarmId, farm } = useWorkingFarm();
  const from = historyStart(plan);
  // A farm is needed for the stock figure; "All farms" shows the first one's.
  const stock = useEggStock(filterFarmId ?? farm?.id ?? null);
  const entries = useEggEntries(filterFarmId, from);

  return (
    <>
      <View style={styles.row}>
        <KpiCard label={t('stock.eggsInStock')} value={formatNumber(stock.data)} icon="package-variant-closed" loading={stock.isPending} />
        <KpiCard
          label={t('stock.lastCollection')}
          value={entries.data?.items[0] ? formatNumber(collected(entries.data.items[0])) : '—'}
          icon="egg-outline"
          loading={entries.isPending}
        />
      </View>
      {can(user, 'EGG', 'CREATE') && (
        <Button label={t('eggs.record')} icon="plus" onPress={() => router.push('/eggs/new')} testID="record-eggs" />
      )}
      {entries.isError && (
        <Banner message={errorMessage(entries.error, t)} actionLabel={t('common.retry')} onAction={() => void entries.refetch()} />
      )}
      {entries.isPending ? (
        <ActivityIndicator />
      ) : entries.data && entries.data.items.length === 0 ? (
        <EmptyState icon="egg-outline" title={t('eggs.emptyTitle')} message={t('eggs.emptyMessage')} />
      ) : (
        <Section title={t('eggs.history')}>
          {entries.data?.items.map((e) => {
            const rel = relativeDay(e.date);
            return (
              <ListRow
                key={e.id}
                title={rel ? `${t(`common.${rel}`)} · ${formatDay(e.date)}` : formatDay(e.date)}
                subtitle={t('eggs.rowSummary', {
                  sold: formatNumber(e.soldEggs),
                  broken: formatNumber(e.brokenEggs + e.damagedEggs),
                  stock: formatNumber(e.remainingEggs),
                })}
                value={formatNumber(collected(e))}
                onPress={() => router.push({ pathname: '/eggs/new', params: { date: e.date } })}
              />
            );
          })}
        </Section>
      )}
      {from && (
        <Text variant="caption" tone="muted" style={styles.center}>
          {t('plans.historyNote', { months: plan.limits.historyMonths })}
        </Text>
      )}
    </>
  );
}

function FeedPanel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const { filterFarmId } = useWorkingFarm();
  const feed = useFeedItems(filterFarmId);
  const items = feed.data ?? [];
  const inStock = items.filter((f) => f.currentQuantity > 0);
  const finished = items.filter((f) => f.currentQuantity <= 0);
  const low = inStock.filter(isLowStock);

  return (
    <>
      {low.length > 0 && <Banner tone="warning" message={t('feed.lowBanner', { count: low.length })} />}
      {can(user, 'FEED', 'CREATE') && (
        <Button label={t('feed.addPurchase')} icon="plus" variant="secondary" onPress={() => router.push('/feed/new')} />
      )}
      {items.length > 0 && (
        <ListRow icon="calendar-clock" title={t('insights.feed.title')} subtitle={t('insights.feed.linkHint')} onPress={() => router.push('/feed/plan')} testID="feed-plan" />
      )}
      {feed.isError && (
        <Banner message={errorMessage(feed.error, t)} actionLabel={t('common.retry')} onAction={() => void feed.refetch()} />
      )}
      {feed.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="grain" title={t('feed.emptyTitle')} message={t('feed.emptyMessage')} />
      ) : (
        <>
          <Section title={t('feed.inStock')}>
            {inStock.map((f) => (
              <ListRow
                key={f.id}
                icon="grain"
                title={f.feedType}
                subtitle={t('feed.boughtOn', { date: formatDay(f.purchaseDate) })}
                value={`${formatNumber(f.currentQuantity)} ${t(`feed.units.${f.unit}`)}`}
                badge={isLowStock(f) ? t('feed.low') : undefined}
                badgeTone="warning"
                onPress={() => router.push({ pathname: '/feed/[id]', params: { id: f.id } })}
              />
            ))}
          </Section>
          <Section title={t('feed.finished')}>
            {finished.map((f) => (
              <ListRow
                key={f.id}
                title={f.feedType}
                subtitle={t('feed.boughtOn', { date: formatDay(f.purchaseDate) })}
                onPress={() => router.push({ pathname: '/feed/[id]', params: { id: f.id } })}
              />
            ))}
          </Section>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  center: { textAlign: 'center' },
});
