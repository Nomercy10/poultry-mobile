import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { LanguageButton } from '@/components/language-button';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { useDashboardSummary } from '@/features/dashboard/api';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { TodayChecklist } from '@/features/today/today-checklist';
import { errorMessage } from '@/lib/api/messages';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { filterFarmId: farmId } = useWorkingFarm();
  const showDashboard = can(user, 'DASHBOARD');
  // The summary endpoint returns money figures to anyone with DASHBOARD:READ;
  // on the phone each card also needs the matching module (workers see no sales or profit).
  const showSales = can(user, 'REVENUE');
  const showExpenses = can(user, 'EXPENSE');
  const showProfit = showSales && showExpenses;
  const summary = useDashboardSummary(farmId);
  const s = summary.data;
  const loading = summary.isPending;

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <Screen
      refreshing={summary.isRefetching}
      onRefresh={showDashboard ? () => void summary.refetch() : undefined}>
      <ScreenHeader title={t('home.greeting', { name: firstName })} right={<LanguageButton />} />
      <View style={styles.farmRow}>
        <FarmSwitcher />
      </View>

      <TodayChecklist />

      {!showDashboard && (
        <Card>
          <Text tone="muted">{t('home.noDashboard')}</Text>
        </Card>
      )}

      {showDashboard && summary.isError && (
        <Banner
          message={errorMessage(summary.error, t)}
          actionLabel={t('common.retry')}
          onAction={() => void summary.refetch()}
        />
      )}

      {showDashboard && (
        <View style={styles.grid}>
          <View style={styles.row}>
            <KpiCard label={t('home.todaysEggs')} value={formatNumber(s?.todaysEggs)} icon="egg-outline" loading={loading} />
            <KpiCard label={t('home.eggStock')} value={formatNumber(s?.currentEggInventory)} icon="package-variant-closed" loading={loading} />
          </View>
          <View style={styles.row}>
            <KpiCard label={t('home.totalChickens')} value={formatNumber(s?.totalChickens)} icon="bird" loading={loading} />
            <KpiCard label={t('home.sickChickens')} value={formatNumber(s?.sickChickens)} icon="medical-bag" tone="danger" loading={loading} />
          </View>
          {(showSales || showExpenses) && (
            <View style={styles.row}>
              {showSales && (
                <KpiCard label={t('home.todaysSales')} value={formatCurrency(s?.todaysSales)} icon="cash-plus" tone="success" loading={loading} />
              )}
              {showExpenses && (
                <KpiCard label={t('home.todaysExpenses')} value={formatCurrency(s?.todaysExpenses)} icon="cash-minus" tone="warning" loading={loading} />
              )}
            </View>
          )}
          {showProfit && (
            <View style={styles.row}>
              {s && s.monthlyLoss > 0 ? (
                <KpiCard label={t('home.monthlyLoss')} value={formatCurrency(s.monthlyLoss)} icon="trending-down" tone="danger" loading={loading} />
              ) : (
                <KpiCard label={t('home.monthlyProfit')} value={formatCurrency(s?.monthlyProfit)} icon="trending-up" tone="success" loading={loading} />
              )}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space.md },
  farmRow: { flexDirection: 'row' },
  row: { flexDirection: 'row', gap: space.md },
});
