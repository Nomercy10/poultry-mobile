import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/kpi-card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { FormHeader } from '@/components/ui/form-header';
import { can } from '@/features/auth/permissions';
import { isLowStock, useFeedItem } from '@/features/feed/api';
import { hasFeature } from '@/features/plans/catalog';
import { LockedFeature } from '@/features/plans/locked-feature';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { formatDay } from '@/lib/dates';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';

export default function FeedDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const feed = useFeedItem(id);
  const f = feed.data;
  const unit = f ? t(`feed.units.${f.unit}`) : '';
  const used = f ? f.quantity - f.currentQuantity : 0;

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={f?.feedType ?? t('feed.title')} subtitle={f ? t('feed.boughtOn', { date: formatDay(f.purchaseDate) }) : undefined} />
      {feed.isPending && <ActivityIndicator />}
      {feed.isError && (
        <Banner message={errorMessage(feed.error, t)} actionLabel={t('common.retry')} onAction={() => void feed.refetch()} />
      )}
      {f && (
        <>
          {isLowStock(f) && <Banner tone="warning" message={t('feed.lowDetail', { threshold: formatNumber(f.lowStockThreshold), unit })} />}
          <View style={styles.row}>
            <KpiCard label={t('feed.left')} value={`${formatNumber(f.currentQuantity)} ${unit}`} icon="grain" tone={isLowStock(f) ? 'warning' : 'default'} />
            <KpiCard label={t('feed.used')} value={`${formatNumber(used)} ${unit}`} icon="silo" />
          </View>
          <Text variant="caption" tone="muted">
            {t('feed.bought', { quantity: formatNumber(f.quantity), unit, cost: formatCurrency(f.cost) })}
          </Text>
          {can(user, 'FEED', 'UPDATE') && f.currentQuantity > 0 && (
            <Button
              label={t('feed.recordUse')}
              icon="minus-circle-outline"
              onPress={() => router.push({ pathname: '/feed/[id]/use', params: { id: f.id } })}
            />
          )}
          {!hasFeature(plan, 'feedStockAlerts') && <LockedFeature feature="feedStockAlerts" />}
          <Section title={t('feed.usage')}>
            {f.consumptions.length === 0 ? (
              <ListRow title={t('feed.noUsage')} />
            ) : (
              f.consumptions.map((c) => (
                <ListRow key={c.id} title={formatDay(c.date)} subtitle={c.notes ?? undefined} value={`${formatNumber(c.quantityUsed)} ${unit}`} />
              ))
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
});
