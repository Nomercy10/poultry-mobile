import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { leave } from '@/lib/navigation';
import { PLAN_ORDER, PLANS } from '@/features/plans/catalog';
import { PlanCard } from '@/features/plans/plan-card';
import { DEMO_PLAN_BY_EMAIL } from '@/features/plans/resolve';
import { usePlan } from '@/features/plans/use-plan';
import { useAuth } from '@/store/auth';

// Read-only for now: no payment links anywhere in the app (store rules), and
// checkout arrives in M5 once the CEO approves prices.
export default function PlansScreen() {
  const { t } = useTranslation();
  const plan = usePlan();
  const email = useAuth((s) => s.user?.email?.toLowerCase() ?? '');
  const isDemo = email in DEMO_PLAN_BY_EMAIL;

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        title={t('plans.title')}
        right={<Button label={t('common.close')} variant="ghost" compact onPress={() => leave('/more')} />}
      />
      <Text tone="muted">{t('plans.everyPlan')}</Text>
      <Banner tone="info" message={t('plans.comingSoon')} />
      {isDemo && (
        <Text variant="caption" tone="muted">
          {t('plans.demoNote')}
        </Text>
      )}
      {PLAN_ORDER.map((id) => (
        <PlanCard key={id} plan={PLANS[id]} current={id === plan.id} />
      ))}
    </Screen>
  );
}
