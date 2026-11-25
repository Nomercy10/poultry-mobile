import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FormHeader } from '@/components/ui/form-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { ListRow } from '@/components/ui/list-row';
import { MonthStepper } from '@/components/ui/month-stepper';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { type Range, useDues, useExpenses, useSales } from '@/features/money/api';
import { EXPENSE_ICONS, SALE_ICONS } from '@/features/money/icons';
import {
  amountDue,
  duesByCustomer,
  type ExpenseCategory,
  isSameMonth,
  monthRange,
  parseNotes,
  round2,
  type Sale,
  startOfMonth,
  totalByBucket,
} from '@/features/money/model';
import { historyStart } from '@/features/plans/catalog';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { formatDay } from '@/lib/dates';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Tab = 'sales' | 'expenses' | 'dues';
const TABS: Tab[] = ['sales', 'expenses', 'dues'];

export default function MoneyScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const params = useLocalSearchParams<{ tab?: string }>();
  const plan = usePlan();
  const { filterFarmId } = useWorkingFarm();
  const canSales = can(user, 'REVENUE');
  const canExpenses = can(user, 'EXPENSE');
  const tabs = TABS.filter((tab) => (tab === 'expenses' ? canExpenses : canSales));
  const initial = tabs.find((tab) => tab === params.tab) ?? tabs[0] ?? 'sales';
  const [tab, setTab] = useState<Tab>(initial);
  const [month, setMonth] = useState(() => startOfMonth());

  const fromIso = historyStart(plan);
  const minMonth = fromIso ? startOfMonth(new Date(`${fromIso}T00:00:00`)) : null;
  const range = monthRange(month);
  const sales = useSales(filterFarmId, range);
  const expenses = useExpenses(filterFarmId, range);

  const salesTotal = round2((sales.data?.items ?? []).reduce((sum, s) => sum + s.total, 0));
  const expensesTotal = round2((expenses.data?.items ?? []).reduce((sum, e) => sum + e.amount, 0));
  const profit = round2(salesTotal - expensesTotal);

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={t('money.title')} right={<FarmSwitcher />} />
      {tab !== 'dues' && <MonthStepper value={month} onChange={setMonth} min={minMonth} />}
      {tab !== 'dues' && (
        <View style={styles.row}>
          {canSales && (
            <KpiCard label={t('money.sales')} value={formatCurrency(salesTotal)} icon="cash-plus" tone="success" loading={sales.isPending} />
          )}
          {canExpenses && (
            <KpiCard label={t('money.expenses')} value={formatCurrency(expensesTotal)} icon="cash-minus" tone="danger" loading={expenses.isPending} />
          )}
        </View>
      )}
      {tab !== 'dues' && canSales && canExpenses && (
        <KpiCard
          label={profit >= 0 ? t('money.profit') : t('money.loss')}
          value={formatCurrency(Math.abs(profit))}
          icon="scale-balance"
          tone={profit >= 0 ? 'success' : 'danger'}
          loading={sales.isPending || expenses.isPending}
        />
      )}
      {tabs.length > 1 && (
        <SegmentedControl<Tab> value={tab} onChange={setTab} options={tabs.map((v) => ({ value: v, label: t(`money.tab_${v}`) }))} />
      )}
      {tab === 'sales' && <SalesPanel range={range} />}
      {tab === 'expenses' && <ExpensesPanel range={range} />}
      {tab === 'dues' && <DuesPanel />}
      {tab !== 'dues' && !!minMonth && isSameMonth(month, minMonth) && (
        <Text variant="caption" tone="muted" style={styles.center}>
          {t('plans.historyNote', { months: plan.limits.historyMonths })}
        </Text>
      )}
    </Screen>
  );
}

function SaleRow({ sale }: { sale: Sale }) {
  const { t } = useTranslation();
  const unit = parseNotes(sale.notes).unit;
  const due = amountDue(sale);
  const quantity = unit ? `${formatNumber(sale.quantity)} ${t(`money.units.${unit}`)}` : formatNumber(sale.quantity);
  return (
    <ListRow
      icon={SALE_ICONS[sale.type]}
      title={`${t(`money.saleTypes.${sale.type}`)} · ${quantity}`}
      subtitle={[sale.customer?.name, formatDay(sale.date)].filter(Boolean).join(' · ')}
      value={formatCurrency(sale.total)}
      badge={due > 0 ? (sale.paymentStatus === 'PARTIAL' ? t('money.status.PARTIAL') : t('money.status.UNPAID')) : undefined}
      badgeTone="warning"
      onPress={() => router.push({ pathname: '/money/sale', params: { id: sale.id } })}
    />
  );
}

function SalesPanel({ range }: { range: Range }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const { filterFarmId } = useWorkingFarm();
  const sales = useSales(filterFarmId, range);
  const items = sales.data?.items ?? [];

  return (
    <>
      {can(user, 'REVENUE', 'CREATE') && (
        <Button label={t('money.addSale')} icon="plus" onPress={() => router.push('/money/sale')} testID="add-sale" />
      )}
      {sales.isError && <Banner message={errorMessage(sales.error, t)} actionLabel={t('common.retry')} onAction={() => void sales.refetch()} />}
      {sales.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="cash-plus" title={t('money.noSales')} message={t('money.noSalesHint')} />
      ) : (
        <Section>
          {items.map((s) => (
            <SaleRow key={s.id} sale={s} />
          ))}
        </Section>
      )}
      {sales.data?.more && <Text variant="caption" tone="muted" style={styles.center}>{t('money.moreOnWeb')}</Text>}
    </>
  );
}

function ExpensesPanel({ range }: { range: Range }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const { filterFarmId } = useWorkingFarm();
  const expenses = useExpenses(filterFarmId, range);
  const items = expenses.data?.items ?? [];

  // Biggest categories first, so the owner sees where the money went.
  const byCategory = new Map<ExpenseCategory, number>();
  for (const e of items) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <>
      {can(user, 'EXPENSE', 'CREATE') && (
        <Button label={t('money.addExpense')} icon="plus" onPress={() => router.push('/money/expense')} testID="add-expense" />
      )}
      {expenses.isError && (
        <Banner message={errorMessage(expenses.error, t)} actionLabel={t('common.retry')} onAction={() => void expenses.refetch()} />
      )}
      {top.length > 0 && (
        <Section title={t('money.whereItWent')}>
          {top.map(([category, amount]) => (
            <ListRow
              key={category}
              icon={EXPENSE_ICONS[category]}
              title={t(`money.categories.${category}`)}
              value={formatCurrency(amount)}
            />
          ))}
        </Section>
      )}
      {expenses.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="cash-minus" title={t('money.noExpenses')} message={t('money.noExpensesHint')} />
      ) : (
        <Section title={t('money.allExpenses')}>
          {items.map((e) => (
            <ListRow
              key={e.id}
              icon={EXPENSE_ICONS[e.category]}
              title={t(`money.categories.${e.category}`)}
              subtitle={[e.vendor, formatDay(e.date), e.paymentMode === 'CREDIT' ? t('money.modes.CREDIT') : null].filter(Boolean).join(' · ')}
              value={formatCurrency(e.amount)}
              onPress={() => router.push({ pathname: '/money/expense', params: { id: e.id } })}
            />
          ))}
        </Section>
      )}
      {expenses.data?.more && <Text variant="caption" tone="muted" style={styles.center}>{t('money.moreOnWeb')}</Text>}
    </>
  );
}

function DuesPanel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { filterFarmId } = useWorkingFarm();
  const dues = useDues(filterFarmId);
  const groups = duesByCustomer(dues.data ?? []);
  const total = round2(groups.reduce((sum, g) => sum + g.due, 0));
  const buckets = totalByBucket(groups);

  return (
    <>
      <KpiCard label={t('money.totalDue')} value={formatCurrency(total)} icon="cash-clock" tone={total > 0 ? 'warning' : 'success'} loading={dues.isPending} />
      {total > 0 && (
        <View style={styles.row}>
          <Bucket label={t('money.age.current')} amount={buckets.current} />
          <Bucket label={t('money.age.late')} amount={buckets.late} />
          <Bucket label={t('money.age.veryLate')} amount={buckets.veryLate} danger />
        </View>
      )}
      {dues.isError && <Banner message={errorMessage(dues.error, t)} actionLabel={t('common.retry')} onAction={() => void dues.refetch()} />}
      {dues.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : groups.length === 0 ? (
        <EmptyState icon="check-decagram-outline" title={t('money.noDues')} message={t('money.noDuesHint')} />
      ) : (
        <Section title={t('money.whoOwes')}>
          {groups.map((g) => (
            <ListRow
              key={g.customerId ?? 'none'}
              icon="account-cash-outline"
              title={g.name ?? t('money.noName')}
              subtitle={t('money.dueSince', { date: formatDay(g.oldest), count: g.sales.length })}
              value={formatCurrency(g.due)}
              badge={g.bucket === 'veryLate' ? t('money.age.veryLate') : g.bucket === 'late' ? t('money.age.late') : undefined}
              badgeTone={g.bucket === 'veryLate' ? 'danger' : 'warning'}
              onPress={() => router.push({ pathname: '/money/customer', params: { id: g.customerId ?? 'none' } })}
              testID={`due-${g.customerId ?? 'none'}`}
            />
          ))}
        </Section>
      )}
    </>
  );
}

function Bucket({ label, amount, danger }: { label: string; amount: number; danger?: boolean }) {
  return (
    <View style={styles.bucket}>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="label" tone={danger && amount > 0 ? 'danger' : 'default'} numeric>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  center: { textAlign: 'center' },
  bucket: { flex: 1, gap: 2, alignItems: 'center' },
});
