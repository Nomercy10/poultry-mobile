import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type Choice, PictureChoice } from '@/components/simple/picture-choice';
import { StepScaffold } from '@/components/simple/step-scaffold';
import { SuccessView } from '@/components/simple/success-view';
import { Text } from '@/components/ui/text';
import { isActive, useBatches, useUpcomingVaccinations, type Vaccination } from '@/features/chickens/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { usePendingSave } from '@/features/simple/pending-save';
import { api } from '@/lib/api/client';
import { formatDay, relativeDay } from '@/lib/dates';

/** Mark a due vaccination as given. Lists every due one across the farm's active batches. */
export default function SimpleVaccine() {
  const { t } = useTranslation();
  const { filterFarmId } = useWorkingFarm();
  const batches = useBatches(filterFarmId);
  // Due today or overdue, plus the next 2 days so workers can prepare.
  const due = useUpcomingVaccinations(2);
  const schedule = usePendingSave((s) => s.schedule);
  const [choice, setChoice] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (batches.isPending || due.isPending) return null;
  const byId = new Map((batches.data ?? []).filter(isActive).map((b) => [b.id, b]));
  const list = (due.data ?? []).filter((v) => byId.has(v.batchId));

  if (done) return <SuccessView summary={done} />;

  const when = (v: Vaccination) => {
    const rel = relativeDay(v.scheduledDate);
    return rel ? t(`common.${rel}`) : formatDay(v.scheduledDate);
  };
  const choices: Choice<string>[] = list.map((v) => ({
    value: v.id,
    label: v.vaccineName,
    icon: 'needle',
    detail: `${byId.get(v.batchId)?.batchNumber ?? ''} · ${t('simple.vaccine.due', { when: when(v) })}`,
  }));
  const selected = list.find((v) => v.id === choice);

  function save() {
    if (!selected) return;
    const summary = t('simple.vaccine.savedSay', { name: selected.vaccineName });
    schedule(summary, () =>
      api.put(`/chickens/${selected.batchId}/vaccinations/${selected.id}`, {
        status: 'ADMINISTERED',
        administeredDate: new Date().toISOString(),
      }),
    );
    setDone(summary);
  }

  return (
    <StepScaffold
      icon="needle"
      prompt={list.length ? t('simple.vaccine.whichQ') : t('simple.vaccine.none')}
      onBack={() => router.back()}
      primary={list.length ? { label: t('simple.save'), icon: 'check-bold', onPress: save, disabled: !selected } : undefined}>
      {list.length ? (
        <PictureChoice list choices={choices} value={choice} onChange={setChoice} />
      ) : (
        <Text tone="muted" style={{ textAlign: 'center' }}>
          {t('simple.nothingHere')}
        </Text>
      )}
    </StepScaffold>
  );
}
