import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { FormHeader } from '@/components/ui/form-header';
import { Icon } from '@/components/ui/icon';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useAllExpenses, useAllSales, useDues } from '@/features/money/api';
import { BASIS_DAYS, cashForecast, MIN_BASIS_DAYS } from '@/features/money/forecast';
import { hasFeature } from '@/features/plans/catalog';
import { LockedFeature } from '@/features/plans/locked-feature';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { addDays, formatDay, startOfLocalDay } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Where cash is heading over the next 30, 60 and 90 days (Pro). */
export default function ForecastScreen() {
  const { t } = useTranslation();
  const plan = usePlan();
  const unlocked = hasFeature(plan, 'cashForecast');
  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={t('insights.forecast.title')} right={unlocked ? <FarmSwitcher /> : undefined} />
      <Text tone="muted">{t('insights.forecast.intro')}</Text>
      {unlocked ? <ForecastBody /> : <LockedFeature feature="cashForecast" />}
    </Screen>
  );
}

function ForecastBody() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { filterFarmId } = useWorkingFarm();
  const [cashToday, setCashToday] = useState<number | undefined>(undefined);
  // Fixed for the screen's life so the query key doesn't change every render.
  const [range] = useState(() => {
    const today = startOfLocalDay();
    return { dateFrom: addDays(today, -BASIS_DAYS).toISOString(), dateTo: addDays(today, 1).toISOString() };
  });
  const sales = useAllSales(filterFarmId, range);
  const expenses = useAllExpenses(filterFarmId, range);
  const dues = useDues(filterFarmId);
  const queries = [sales, expenses, dues];
  const failed = queries.find((q) => q.isError);

  if (failed) return <Banner message={errorMessage(failed.error, t)} actionLabel={t('common.retry')} onAction={() => queries.forEach((q) => void q.refetch())} />;
  if (queries.some((q) => q.isPending)) return <ActivityIndicator color={colors.primary} />;

  const f = cashForecast({
    sales: sales.data?.items ?? [],
    expenses: expenses.data?.items ?? [],
    dues: dues.data ?? [],
    cashToday: cashToday ?? 0,
  });

  return (
    <>
      <NumberField
        label={t('insights.forecast.cashToday')}
        unit="₹"
        value={cashToday}
        onChange={setCashToday}
        step={1000}
        hint={t('insights.forecast.cashTodayHint')}
        testID="cash-today"
      />
      {!f.enoughData && <Banner tone="info" message={t('insights.forecast.notEnough', { count: f.basisDays, min: MIN_BASIS_DAYS })} />}
      <Card style={styles.verdict}>
        <Icon
          name={f.shortOn ? 'alert-circle-outline' : 'check-circle-outline'}
          size={28}
          color={f.shortOn ? colors.danger : colors.success}
        />
        <Text variant="label" tone={f.shortOn ? 'danger' : 'success'} style={styles.flex} testID="forecast-verdict">
          {f.shortOn
            ? t('insights.forecast.short', { amount: formatCurrency(f.shortBy), date: formatDay(f.shortOn) })
            : t('insights.forecast.ok')}
        </Text>
      </Card>
      <Section title={t('insights.forecast.ahead')}>
        {f.windows.map((w) => (
          <View key={w.days} style={styles.window}>
            <View style={styles.flex}>
              <Text variant="label">{t('insights.forecast.nextDays', { count: w.days })}</Text>
              <Text variant="caption" tone="muted" numeric>
                {t('insights.forecast.inOut', { in: formatCurrency(w.moneyIn), out: formatCurrency(w.moneyOut) })}
              </Text>
            </View>
            <View style={styles.end}>
              <Text variant="caption" tone="muted">
                {t('insights.forecast.cashAtEnd')}
              </Text>
              <Text variant="label" tone={w.endCash < 0 ? 'danger' : 'default'} numeric>
                {formatCurrency(w.endCash)}
              </Text>
            </View>
          </View>
        ))}
      </Section>
      <Section title={t('insights.forecast.howTitle')}>
        <Line text={t('insights.forecast.basis', { count: f.basisDays })} />
        <Line text={t('insights.forecast.inPerDay')} value={formatCurrency(f.inPerDay)} />
        <Line text={t('insights.forecast.outPerDay')} value={formatCurrency(f.outPerDay)} />
        {f.expectedDues > 0 && <Line text={t('insights.forecast.expectedDues')} value={formatCurrency(f.expectedDues)} />}
        {f.riskyDues > 0 && <Line text={t('insights.forecast.riskyDues')} value={formatCurrency(f.riskyDues)} danger />}
      </Section>
      <Text variant="caption" tone="muted" style={styles.center}>
        {t('insights.forecast.disclaimer')}
      </Text>
    </>
  );
}

function Line({ text, value, danger }: { text: string; value?: string; danger?: boolean }) {
  return (
    <View style={styles.window}>
      <Text style={styles.flex}>{text}</Text>
      {value !== undefined && (
        <Text variant="label" tone={danger ? 'danger' : 'default'} numeric>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  verdict: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  window: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  flex: { flex: 1 },
  end: { alignItems: 'flex-end', gap: 2 },
  center: { textAlign: 'center' },
});
