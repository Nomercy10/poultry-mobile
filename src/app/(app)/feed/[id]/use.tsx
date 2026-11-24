import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useFeedItem, useRecordFeedUse } from '@/features/feed/api';
import { errorMessage } from '@/lib/api/messages';
import { leave } from '@/lib/navigation';
import { localDayIso, startOfLocalDay } from '@/lib/dates';
import { formatNumber } from '@/lib/format';

export default function FeedUseScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const feed = useFeedItem(id);
  const record = useRecordFeedUse(id);
  const [day, setDay] = useState(() => startOfLocalDay());
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);

  const f = feed.data;
  const unit = f ? t(`feed.units.${f.unit}`) : '';
  const tooMuch = !!f && quantity !== undefined && quantity > f.currentQuantity;
  const error = !quantity || quantity <= 0 ? t('form.moreThanZero') : tooMuch ? t('feed.tooMuch', { left: formatNumber(f?.currentQuantity), unit }) : undefined;

  async function onSave() {
    setTried(true);
    if (error) return;
    await record.mutateAsync({ date: localDayIso(day), quantityUsed: quantity!, notes: notes.trim() || undefined });
    leave('/stock');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={t('feed.useTitle')} subtitle={f ? `${f.feedType} · ${t('feed.leftShort', { left: formatNumber(f.currentQuantity), unit })}` : undefined} />
      <DateStepper label={t('form.date')} value={day} onChange={(d) => setDay(startOfLocalDay(d))} />
      <NumberField
        label={t('feed.quantityUsed')}
        value={quantity}
        onChange={setQuantity}
        decimal
        step={f?.unit === 'KG' ? 10 : 1}
        unit={unit}
        error={tried || tooMuch ? error : undefined}
        testID="feed-used"
      />
      <TextField label={t('form.notesOptional')} value={notes} onChangeText={setNotes} multiline />
      {feed.isError && <Banner message={errorMessage(feed.error, t)} />}
      {record.isError && <Banner message={errorMessage(record.error, t)} />}
      <Button label={t('form.save')} icon="check" onPress={() => void onSave().catch(() => {})} loading={record.isPending} disabled={!f} />
    </Screen>
  );
}
