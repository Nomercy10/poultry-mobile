import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { FEED_UNITS, type FeedUnit, useCreateFeedPurchase } from '@/features/feed/api';
import { errorMessage } from '@/lib/api/messages';
import { leave } from '@/lib/navigation';
import { localDayIso, startOfLocalDay } from '@/lib/dates';

export default function FeedPurchaseScreen() {
  const { t } = useTranslation();
  const { farm } = useWorkingFarm();
  const create = useCreateFeedPurchase();
  const [feedType, setFeedType] = useState('');
  const [day, setDay] = useState(() => startOfLocalDay());
  const [unit, setUnit] = useState<FeedUnit>('KG');
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [cost, setCost] = useState<number | undefined>(undefined);
  const [threshold, setThreshold] = useState<number | undefined>(0);
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);

  const errors = {
    feedType: feedType.trim() ? undefined : t('feed.typeRequired'),
    quantity: quantity && quantity > 0 ? undefined : t('form.moreThanZero'),
    cost: cost !== undefined && cost >= 0 ? undefined : t('form.required'),
  };
  const valid = !errors.feedType && !errors.quantity && !errors.cost;

  async function onSave() {
    setTried(true);
    if (!valid || !farm) return;
    await create.mutateAsync({
      farmId: farm.id,
      feedType: feedType.trim(),
      purchaseDate: localDayIso(day),
      quantity: quantity!,
      unit,
      cost: cost!,
      lowStockThreshold: threshold ?? 0,
      notes: notes.trim() || undefined,
    });
    leave('/stock');
  }

  const unitLabel = t(`feed.units.${unit}`);

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={t('feed.purchaseTitle')} subtitle={farm?.name} />
      <TextField
        label={t('feed.type')}
        placeholder={t('feed.typePlaceholder')}
        value={feedType}
        onChangeText={setFeedType}
        error={tried ? errors.feedType : undefined}
      />
      <DateStepper label={t('feed.purchaseDate')} value={day} onChange={(d) => setDay(startOfLocalDay(d))} />
      <Text variant="label">{t('feed.unit')}</Text>
      <SegmentedControl<FeedUnit>
        value={unit}
        onChange={setUnit}
        options={FEED_UNITS.map((u) => ({ value: u, label: t(`feed.units.${u}`) }))}
      />
      <NumberField label={t('feed.quantity')} value={quantity} onChange={setQuantity} decimal step={unit === 'KG' ? 50 : 1} unit={unitLabel} error={tried ? errors.quantity : undefined} />
      <NumberField label={t('feed.cost')} value={cost} onChange={setCost} decimal step={500} unit="₹" error={tried ? errors.cost : undefined} />
      <NumberField label={t('feed.threshold')} value={threshold} onChange={setThreshold} decimal step={unit === 'KG' ? 50 : 1} unit={unitLabel} hint={t('feed.thresholdHint')} />
      <TextField label={t('form.notesOptional')} value={notes} onChangeText={setNotes} multiline />
      {!farm && <Banner tone="warning" message={t('form.noFarm')} />}
      {create.isError && <Banner message={errorMessage(create.error, t)} />}
      <Button label={t('form.save')} icon="check" onPress={() => void onSave().catch(() => {})} loading={create.isPending} disabled={!farm} />
    </Screen>
  );
}
