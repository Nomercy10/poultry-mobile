import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FarmSwitcher } from '@/features/farms/farm-switcher';

export default function FlockScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <ScreenHeader title={t('flock.title')} right={<FarmSwitcher />} />
      <EmptyState icon="bird" title={t('flock.emptyTitle')} message={t('flock.emptyMessage')} />
    </Screen>
  );
}
