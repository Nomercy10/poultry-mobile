import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useAddVaccination, useBatch } from '@/features/chickens/api';
import { errorMessage } from '@/lib/api/messages';
import { leave } from '@/lib/navigation';
import { addDays, localDayIso, startOfLocalDay } from '@/lib/dates';

export default function ScheduleVaccinationScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const batch = useBatch(id);
  const add = useAddVaccination(id);
  const [name, setName] = useState('');
  const [day, setDay] = useState(() => addDays(startOfLocalDay(), 7));
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);
  const error = name.trim() ? undefined : t('form.required');

  async function onSave() {
    setTried(true);
    if (error) return;
    await add.mutateAsync({ vaccineName: name.trim(), scheduledDate: localDayIso(day), notes: notes.trim() || undefined });
    leave('/flock');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader kind="close" title={t('batches.scheduleVaccination')} subtitle={batch.data?.batchNumber} />
      <TextField label={t('batches.vaccineName')} placeholder={t('batches.vaccinePlaceholder')} value={name} onChangeText={setName} error={tried ? error : undefined} />
      <DateStepper label={t('batches.dueDate')} value={day} onChange={(d) => setDay(startOfLocalDay(d))} max={null} />
      <TextField label={t('form.notesOptional')} value={notes} onChangeText={setNotes} multiline />
      {add.isError && <Banner message={errorMessage(add.error, t)} />}
      <Button label={t('form.save')} icon="check" onPress={() => void onSave().catch(() => {})} loading={add.isPending} />
    </Screen>
  );
}
