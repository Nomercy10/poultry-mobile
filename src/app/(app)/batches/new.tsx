import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { isActive, useBatches, useCreateBatch } from '@/features/chickens/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { canAddBatch } from '@/features/plans/catalog';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { localDayIso, startOfLocalDay } from '@/lib/dates';

function suggestBatchNumber(existing: string[], today = new Date()) {
  const year = today.getFullYear();
  let n = existing.length + 1;
  let candidate = '';
  do {
    candidate = `BATCH-${year}-${String(n).padStart(3, '0')}`;
    n += 1;
  } while (existing.includes(candidate));
  return candidate;
}

export default function NewBatchScreen() {
  const { t } = useTranslation();
  const plan = usePlan();
  const { farm, filterFarmId } = useWorkingFarm();
  // All batches (any farm) for a unique number; batch numbers are unique across the system.
  const allBatches = useBatches(null);
  const farmBatches = (allBatches.data ?? []).filter((b) => !filterFarmId || b.farmId === filterFarmId);
  const atLimit = !canAddBatch(plan, farmBatches.filter(isActive).length);
  const create = useCreateBatch();

  const [batchNumber, setBatchNumber] = useState<string | null>(null);
  const [breed, setBreed] = useState('');
  const [day, setDay] = useState(() => startOfLocalDay());
  const [count, setCount] = useState<number | undefined>(undefined);
  const [age, setAge] = useState<number | undefined>(1);
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);

  const number = batchNumber ?? suggestBatchNumber((allBatches.data ?? []).map((b) => b.batchNumber));
  const errors = {
    number: number.trim() ? undefined : t('form.required'),
    breed: breed.trim() ? undefined : t('form.required'),
    count: count && count > 0 ? undefined : t('form.moreThanZero'),
  };
  const valid = !errors.number && !errors.breed && !errors.count;

  async function onSave() {
    setTried(true);
    if (!valid || !farm || atLimit) return;
    const batch = await create.mutateAsync({
      farmId: farm.id,
      batchNumber: number.trim(),
      breed: breed.trim(),
      purchaseDate: localDayIso(day),
      initialCount: count!,
      ageInDaysAtEntry: age ?? 0,
      notes: notes.trim() || undefined,
    });
    router.replace({ pathname: '/batches/[id]', params: { id: batch.id } });
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={t('batches.newTitle')} subtitle={farm?.name} />
      {atLimit && (
        <Banner
          tone="info"
          message={t('plans.limitBatches', { count: plan.limits.activeBatches })}
          actionLabel={t('plans.seePlans')}
          onAction={() => router.push('/plans')}
        />
      )}
      <TextField label={t('batches.number')} value={number} onChangeText={setBatchNumber} autoCapitalize="characters" error={tried ? errors.number : undefined} />
      <TextField label={t('batches.breed')} placeholder={t('batches.breedPlaceholder')} value={breed} onChangeText={setBreed} error={tried ? errors.breed : undefined} />
      <DateStepper label={t('batches.arrivalDate')} value={day} onChange={(d) => setDay(startOfLocalDay(d))} />
      <NumberField label={t('batches.birds')} value={count} onChange={setCount} step={100} error={tried ? errors.count : undefined} />
      <NumberField label={t('batches.ageAtArrival')} value={age} onChange={setAge} unit={t('batches.days')} />
      <TextField label={t('form.notesOptional')} value={notes} onChangeText={setNotes} multiline />
      {create.isError && <Banner message={errorMessage(create.error, t)} />}
      <Button label={t('form.save')} icon="check" onPress={() => void onSave().catch(() => {})} loading={create.isPending} disabled={!farm || atLimit} />
    </Screen>
  );
}
