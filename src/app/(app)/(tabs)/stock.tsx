import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FarmSwitcher } from '@/features/farms/farm-switcher';

export default function StockScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <ScreenHeader title={t('stock.title')} right={<FarmSwitcher />} />
      <EmptyState icon="warehouse" title={t('stock.emptyTitle')} message={t('stock.emptyMessage')} />
    </Screen>
  );
}
