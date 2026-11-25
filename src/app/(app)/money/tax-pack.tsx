import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormHeader } from '@/components/ui/form-header';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { FarmSwitcher } from '@/features/farms/farm-switcher';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { useAllExpenses, useAllSales } from '@/features/money/api';
import type { ExpenseCategory, SaleType } from '@/features/money/model';
import { financialYearLabel, financialYearOf, financialYearRange, taxPackCsv, taxSummary } from '@/features/money/tax-pack';
import { hasFeature } from '@/features/plans/catalog';
import { LockedFeature } from '@/features/plans/locked-feature';
import { usePlan } from '@/features/plans/use-plan';
import i18n from '@/i18n';
import { errorMessage } from '@/lib/api/messages';
import { formatCurrency } from '@/lib/format';
import { shareTextFile } from '@/lib/share-file';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** How many past financial years can be picked. */
const YEARS = 3;

/** One financial year of sales and expenses, summed up and exported for the CA (Pro). */
export default function TaxPackScreen() {
  const { t } = useTranslation();
  const plan = usePlan();
  const unlocked = hasFeature(plan, 'taxPack');
  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={t('insights.tax.title')} right={unlocked ? <FarmSwitcher /> : undefined} />
      <Text tone="muted">{t('insights.tax.intro')}</Text>
      {unlocked ? <TaxBody /> : <LockedFeature feature="taxPack" />}
    </Screen>
  );
}

function TaxBody() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { filterFarmId, farm } = useWorkingFarm();
  const current = financialYearOf();
  const [year, setYear] = useState(current);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const range = financialYearRange(year);
  const sales = useAllSales(filterFarmId, range);
  const expenses = useAllExpenses(filterFarmId, range);
  const failed = sales.isError ? sales : expenses.isError ? expenses : null;
  const pending = sales.isPending || expenses.isPending;
  const saleItems = sales.data?.items ?? [];
  const expenseItems = expenses.data?.items ?? [];
  const s = taxSummary(saleItems, expenseItems);
  const incomplete = sales.data?.complete === false || expenses.data?.complete === false;

  async function share() {
    setSharing(true);
    setShareError(false);
    try {
      // CSV headings and labels in English for the CA, whatever the app language.
      const en = i18n.getFixedT('en');
      const farmName = filterFarmId ? (farm?.name ?? '') : t('common.allFarms');
      const csv = taxPackCsv(farmName, year, s, saleItems, expenseItems, {
        saleType: (x) => en(`money.saleTypes.${x}`),
        category: (x) => en(`money.categories.${x}`),
        paymentMode: (x) => en(`money.modes.${x}`),
        status: (x) => en(`money.status.${x}`),
      });
      await shareTextFile(`tax-pack-${financialYearLabel(year)}.csv`, csv, 'text/csv', t('insights.tax.shareTitle'));
    } catch {
      setShareError(true);
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <ChoiceChips
        label={t('insights.tax.year')}
        value={String(year)}
        onChange={(v) => setYear(Number(v))}
        options={Array.from({ length: YEARS }, (_, i) => current - i).map((y) => ({ value: String(y), label: financialYearLabel(y) }))}
        testID="tax-year"
      />
      <Text variant="caption" tone="muted">
        {t('insights.tax.yearRange', { from: year, to: year + 1 })}
      </Text>
      {failed && <Banner message={errorMessage(failed.error, t)} actionLabel={t('common.retry')} onAction={() => void failed.refetch()} />}
      {incomplete && <Banner tone="warning" message={t('insights.tax.incomplete')} />}
      {pending ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Section title={t('insights.tax.income')}>
            <Line label={t('insights.tax.salesTotal', { count: s.saleCount })} value={s.salesTotal} bold />
            {(Object.entries(s.salesByType) as [SaleType, number][]).map(([type, amount]) => (
              <Line key={type} label={t(`money.saleTypes.${type}`)} value={amount} indent />
            ))}
            <Line label={t('insights.tax.received')} value={s.received} />
            {s.stillDue > 0 && <Line label={t('insights.tax.stillDue')} value={s.stillDue} warning />}
          </Section>
          <Section title={t('insights.tax.costs')}>
            <Line label={t('insights.tax.expensesTotal', { count: s.expenseCount })} value={s.expensesTotal} bold />
            {(Object.entries(s.expensesByCategory) as [ExpenseCategory, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => (
                <Line key={cat} label={t(`money.categories.${cat}`)} value={amount} indent />
              ))}
            <Line label={t('insights.tax.gstPaid')} value={s.gstPaid} />
          </Section>
          <Section>
            <Line label={s.profit >= 0 ? t('money.profit') : t('money.loss')} value={Math.abs(s.profit)} bold danger={s.profit < 0} />
          </Section>
          <Button
            label={t('insights.tax.share')}
            icon="file-delimited-outline"
            onPress={() => void share()}
            loading={sharing}
            disabled={s.saleCount + s.expenseCount === 0}
            testID="share-tax-pack"
          />
          {shareError && <Banner message={t('insights.tax.shareFailed')} />}
          <Text variant="caption" tone="muted" style={styles.center}>
            {t('insights.tax.disclaimer')}
          </Text>
        </>
      )}
    </>
  );
}

function Line({ label, value, bold, indent, warning, danger }: { label: string; value: number; bold?: boolean; indent?: boolean; warning?: boolean; danger?: boolean }) {
  return (
    <View style={[styles.line, indent && styles.indent]}>
      <Text variant={bold ? 'label' : 'body'} tone={indent ? 'muted' : 'default'} style={styles.flex}>
        {label}
      </Text>
      <Text variant={bold ? 'label' : 'body'} tone={danger ? 'danger' : warning ? 'warning' : 'default'} numeric>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm },
  indent: { paddingLeft: space.xl },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
});
