import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FormHeader } from '@/components/ui/form-header';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useFeedItems, useFeedUsage } from '@/features/feed/api';
import { COVER_DAYS, type FeedRunway, feedRunway, LEAD_DAYS, type RunwayStatus, USAGE_DAYS } from '@/features/feed/runway';
import { hasFeature } from '@/features/plans/catalog';
import { LockedFeature } from '@/features/plans/locked-feature';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { formatDay } from '@/lib/dates';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const TONE: Record<RunwayStatus, 'danger' | 'warning' | 'success' | 'neutral'> = {
  out: 'danger',
  orderNow: 'danger',
  soon: 'warning',
  ok: 'success',
  noUse: 'neutral',
};

/** Days of feed left for each feed. Pro adds when to order, how much and the cost. */
export default function FeedPlanScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const planner = hasFeature(plan, 'feedPlanner');
  const { filterFarmId } = useWorkingFarm();
  const items = useFeedItems(filterFarmId);
  const usage = useFeedUsage(filterFarmId, USAGE_DAYS);
  const canReports = can(user, 'REPORT');
  const failed = items.isError ? items : usage.isError ? usage : null;
  const rows = feedRunway(items.data ?? [], usage.data ?? []);

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={t('insights.feed.title')} right={<FarmSwitcher />} />
      <Text tone="muted">{t('insights.feed.intro', { days: USAGE_DAYS })}</Text>
      {!canReports && <Banner tone="info" message={t('insights.feed.noReportAccess')} />}
      {failed && <Banner message={errorMessage(failed.error, t)} actionLabel={t('common.retry')} onAction={() => void failed.refetch()} />}
      {items.isPending || (canReports && usage.isPending) ? (
        <ActivityIndicator color={colors.primary} />
      ) : rows.length === 0 ? (
        <EmptyState icon="grain" title={t('feed.emptyTitle')} message={t('feed.emptyMessage')} />
      ) : (
        rows.map((r) => <RunwayCard key={`${r.feedType}|${r.unit}`} row={r} planner={planner} />)
      )}
      {!planner && rows.length > 0 && <LockedFeature feature="feedPlanner" />}
      {planner && rows.length > 0 && (
        <Text variant="caption" tone="muted" style={styles.center}>
          {t('insights.feed.assumptions', { lead: LEAD_DAYS, cover: COVER_DAYS })}
        </Text>
      )}
    </Screen>
  );
}

function RunwayCard({ row, planner }: { row: FeedRunway; planner: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unit = t(`feed.units.${row.unit}`, { defaultValue: row.unit });
  const showPlan = planner && row.status !== 'noUse';

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Icon name="grain" color={colors.primary} />
        <Text variant="label" style={styles.flex}>
          {row.feedType}
        </Text>
        <Badge label={t(`insights.feed.status.${row.status}`)} tone={TONE[row.status]} />
      </View>
      <Text variant="display" numeric tone={row.status === 'out' || row.status === 'orderNow' ? 'danger' : 'default'}>
        {row.daysLeft === null ? '—' : t('insights.feed.daysLeft', { count: row.daysLeft })}
      </Text>
      <Text variant="caption" tone="muted" numeric>
        {row.status === 'noUse'
          ? t('insights.feed.noUse', { stock: formatNumber(row.stock), unit })
          : t('insights.feed.usage', { stock: formatNumber(row.stock), perDay: formatNumber(row.usedPerDay), unit })}
      </Text>
      {showPlan && row.orderBy && (
        <View style={[styles.plan, { borderTopColor: colors.border }]}>
          <Line label={t('insights.feed.orderBy')} value={formatDay(row.orderBy)} />
          <Line label={t('insights.feed.orderQty')} value={`${formatNumber(row.orderQuantity)} ${unit}`} />
          <Line
            label={t('insights.feed.orderCost')}
            value={row.orderCost === null ? t('insights.feed.noPrice') : formatCurrency(row.orderCost)}
          />
        </View>
      )}
    </Card>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text tone="muted" style={styles.flex}>
        {label}
      </Text>
      <Text variant="label" numeric>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  plan: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.sm, gap: space.xs },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  center: { textAlign: 'center' },
});
