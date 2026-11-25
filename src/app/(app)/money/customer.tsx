import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FormHeader } from '@/components/ui/form-header';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { useDues, useParties } from '@/features/money/api';
import { SALE_ICONS } from '@/features/money/icons';
import { amountDue, duesByCustomer, isLatePayer } from '@/features/money/model';
import { sendReminder } from '@/features/money/reminder';
import { hasFeature } from '@/features/plans/catalog';
import { LockedFeature } from '@/features/plans/locked-feature';
import { usePlan } from '@/features/plans/use-plan';
import { formatDay } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** One customer's unpaid sales, with a WhatsApp reminder for the total. `id=none` = sales with no name. */
export default function CustomerDuesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = id === 'none' ? null : id;
  const customers = useParties('customers');
  const dues = useDues(null);
  const customer = (customers.data ?? []).find((c) => c.id === customerId) ?? null;
  const group = duesByCustomer(dues.data ?? []).find((g) => g.customerId === customerId);
  const name = customer?.name ?? group?.name ?? t('money.noName');

  const message = t('money.reminderTotalText', {
    name: customer?.name ?? '',
    amount: formatCurrency(group?.due ?? 0),
    date: group ? formatDay(group.oldest) : '',
  });

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={name}
        subtitle={customer?.phone ?? undefined}
        right={
          customer && can(user, 'CUSTOMER', 'UPDATE') ? (
            <Button
              label={t('money.edit')}
              variant="ghost"
              compact
              onPress={() => router.push({ pathname: '/money/person', params: { kind: 'customers', id: customer.id } })}
            />
          ) : undefined
        }
      />
      {dues.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : !group ? (
        <EmptyState icon="check-decagram-outline" title={t('money.allPaid')} />
      ) : (
        <>
          <Card style={styles.total}>
            <Text variant="label" tone="muted">
              {t('money.totalDue')}
            </Text>
            <Text variant="display" tone="warning" numeric>
              {formatCurrency(group.due)}
            </Text>
            <Text variant="caption" tone="muted">
              {t('money.dueSince', { date: formatDay(group.oldest), count: group.sales.length })}
            </Text>
          </Card>
          {customerId && hasFeature(plan, 'latePayers') && isLatePayer(group) && <Banner tone="warning" message={t('insights.latePayerHint')} />}
          {hasFeature(plan, 'creditLimits') && !!customer?.creditLimit && (
            <Text variant="caption" tone={group.due > customer.creditLimit ? 'danger' : 'muted'} style={styles.center}>
              {group.due > customer.creditLimit
                ? t('insights.credit.over', { limit: formatCurrency(customer.creditLimit), over: formatCurrency(group.due - customer.creditLimit) })
                : t('insights.credit.left', { limit: formatCurrency(customer.creditLimit), left: formatCurrency(customer.creditLimit - group.due) })}
            </Text>
          )}
          <Button label={t('money.sendReminder')} icon="whatsapp" onPress={() => void sendReminder(customer?.phone, message).catch(() => {})} testID="send-reminder" />
          {!hasFeature(plan, 'paymentReminders') && <LockedFeature feature="paymentReminders" />}
          <Section title={t('money.unpaidSales')}>
            {group.sales.map((s) => (
              <ListRow
                key={s.id}
                icon={SALE_ICONS[s.type]}
                title={t(`money.saleTypes.${s.type}`)}
                subtitle={formatDay(s.date)}
                value={formatCurrency(amountDue(s))}
                badge={s.paymentStatus === 'PARTIAL' ? t('money.status.PARTIAL') : undefined}
                badgeTone="warning"
                onPress={() => router.push({ pathname: '/money/sale', params: { id: s.id } })}
              />
            ))}
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ total: { alignItems: 'center', gap: space.xs }, center: { textAlign: 'center' } });
