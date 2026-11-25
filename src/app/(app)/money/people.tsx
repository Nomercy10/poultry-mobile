import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FormHeader } from '@/components/ui/form-header';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { can } from '@/features/auth/permissions';
import { type PartyKind, useDues, useParties } from '@/features/money/api';
import { duesByCustomer } from '@/features/money/model';
import { errorMessage } from '@/lib/api/messages';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/use-theme';

/** Customers or suppliers. Customers show what they owe. */
export default function PeopleScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind: PartyKind = params.kind === 'suppliers' ? 'suppliers' : 'customers';
  const isCustomers = kind === 'customers';
  const people = useParties(kind);
  const dues = useDues(null);
  const owed = new Map(duesByCustomer(isCustomers ? (dues.data ?? []) : []).map((g) => [g.customerId, g.due]));

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader title={isCustomers ? t('more.customers') : t('more.suppliers')} />
      {can(user, isCustomers ? 'CUSTOMER' : 'SUPPLIER', 'CREATE') && (
        <Button
          label={isCustomers ? t('money.addCustomer') : t('money.addSupplier')}
          icon="account-plus-outline"
          onPress={() => router.push({ pathname: '/money/person', params: { kind } })}
          testID="add-person"
        />
      )}
      {people.isError && <Banner message={errorMessage(people.error, t)} actionLabel={t('common.retry')} onAction={() => void people.refetch()} />}
      {people.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : (people.data ?? []).length === 0 ? (
        <EmptyState icon={isCustomers ? 'account-cash-outline' : 'truck-outline'} title={isCustomers ? t('money.noCustomers') : t('money.noSuppliers')} />
      ) : (
        <Section>
          {(people.data ?? []).map((p) => {
            const due = owed.get(p.id) ?? 0;
            return (
              <ListRow
                key={p.id}
                icon={isCustomers ? 'account-cash-outline' : 'truck-outline'}
                title={p.name}
                subtitle={[p.phone, p.suppliesType].filter(Boolean).join(' · ') || undefined}
                value={due > 0 ? formatCurrency(due) : undefined}
                badge={due > 0 ? t('money.owes') : undefined}
                badgeTone="warning"
                onPress={() =>
                  isCustomers
                    ? router.push({ pathname: '/money/customer', params: { id: p.id } })
                    : router.push({ pathname: '/money/person', params: { kind, id: p.id } })
                }
              />
            );
          })}
        </Section>
      )}
    </Screen>
  );
}
