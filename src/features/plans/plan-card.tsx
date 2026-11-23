import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatCurrency } from '@/lib/format';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import type { Plan } from './catalog';

function limitText(value: number, t: ReturnType<typeof useTranslation>['t']) {
  return Number.isFinite(value) ? String(value) : t('plans.unlimited');
}

export function PlanCard({ plan, current }: { plan: Plan; current: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { limits } = plan;

  const price =
    plan.priceMonthly === null
      ? t('plans.byQuote')
      : plan.priceMonthly === 0
        ? t('plans.forever')
        : t('plans.perMonth', { price: formatCurrency(plan.priceMonthly) });

  const history = Number.isFinite(limits.historyMonths)
    ? t('plans.months', { count: limits.historyMonths })
    : t('plans.all');

  return (
    <Card style={[styles.card, current ? { borderColor: colors.primary, borderWidth: 2 } : undefined]}>
      <View style={styles.header}>
        <Text variant="heading">{t(`plans.${plan.id}`)}</Text>
        {current && <Badge label={t('plans.current')} tone="primary" />}
      </View>
      <View>
        <Text variant="label" numeric>
          {price}
        </Text>
        {!!plan.priceYearly && (
          <Text variant="caption" tone="muted" numeric>
            {t('plans.perYear', { price: formatCurrency(plan.priceYearly) })}
          </Text>
        )}
      </View>
      <View style={styles.list}>
        <Text variant="caption">{t('plans.f_farms', { value: limitText(limits.farms, t) })}</Text>
        <Text variant="caption">{t('plans.f_batches', { value: limitText(limits.activeBatches, t) })}</Text>
        <Text variant="caption">{t('plans.f_people', { value: limitText(limits.people, t) })}</Text>
        <Text variant="caption">{t('plans.f_history', { value: history })}</Text>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <Icon name="check" size={16} color={colors.success} />
            <Text variant="caption" style={styles.flex}>
              {t(`plans.feature_${feature}`)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  list: { gap: space.xs },
  feature: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
});
