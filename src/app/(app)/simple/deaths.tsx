import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BigCounter } from '@/components/simple/big-counter';
import { type Choice, PictureChoice } from '@/components/simple/picture-choice';
import { StepScaffold } from '@/components/simple/step-scaffold';
import { SuccessView } from '@/components/simple/success-view';
import { Banner } from '@/components/ui/banner';
import { Text } from '@/components/ui/text';
import { type Batch, isActive, useBatches } from '@/features/chickens/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { usePendingSave } from '@/features/simple/pending-save';
import { api } from '@/lib/api/client';
import { localDayIso } from '@/lib/dates';
import { formatNumber } from '@/lib/format';

type Cause = 'sick' | 'heat' | 'animal' | 'unknown';
// Stored in English so web reports stay consistent whatever language the worker uses.
const CAUSE_TEXT: Record<Cause, string | undefined> = {
  sick: 'Cause: sick',
  heat: 'Cause: heat',
  animal: 'Cause: animal attack',
  unknown: undefined,
};
type Step = 'batch' | 'count' | 'cause' | 'review' | 'done';

export default function SimpleDeaths() {
  const { t } = useTranslation();
  const { filterFarmId } = useWorkingFarm();
  const batches = useBatches(filterFarmId);
  const active = (batches.data ?? []).filter(isActive);
  if (batches.isPending) return null;
  if (active.length === 0) {
    return (
      <StepScaffold icon="bird" prompt={t('pick.noBatches')} onBack={() => router.back()}>
        <Text tone="muted">{t('simple.nothingHere')}</Text>
      </StepScaffold>
    );
  }
  return <DeathsFlow batches={active} />;
}

function DeathsFlow({ batches }: { batches: Batch[] }) {
  const { t } = useTranslation();
  const schedule = usePendingSave((s) => s.schedule);
  const single = batches.length === 1;
  const [batchId, setBatchId] = useState<string | null>(single ? batches[0].id : null);
  const [count, setCount] = useState(1);
  const [cause, setCause] = useState<Cause>('unknown');
  const [step, setStep] = useState<Step>(single ? 'count' : 'batch');
  const batch = batches.find((b) => b.id === batchId);
  const tooMany = !!batch && count > batch.currentCount;
  const savedSay = t('simple.deaths.savedSay', { count: formatNumber(count) });

  function save() {
    if (!batch) return;
    schedule(savedSay, () =>
      api.post(`/chickens/${batch.id}/events`, {
        type: 'MORTALITY',
        eventDate: localDayIso(),
        quantity: count,
        description: CAUSE_TEXT[cause],
      }),
    );
    setStep('done');
  }

  if (step === 'done') return <SuccessView summary={savedSay} />;

  if (step === 'batch') {
    const choices: Choice<string>[] = batches.map((b) => ({
      value: b.id,
      label: b.batchNumber,
      icon: 'bird',
      detail: `${b.breed} · ${formatNumber(b.currentCount)}`,
    }));
    return (
      <StepScaffold
        icon="bird"
        prompt={t('simple.deaths.batchQ')}
        onBack={() => router.back()}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('count'), disabled: !batchId }}>
        <PictureChoice list choices={choices} value={batchId} onChange={setBatchId} />
      </StepScaffold>
    );
  }

  if (step === 'count') {
    return (
      <StepScaffold
        icon="heart-broken-outline"
        iconTint="danger"
        prompt={t('simple.deaths.countQ')}
        onBack={() => (single ? router.back() : setStep('batch'))}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('cause'), disabled: count < 1 || tooMany }}>
        <BigCounter label={batch?.batchNumber ?? ''} icon="bird" value={count} min={1} onChange={setCount} testID="death-count" />
        {tooMany && <Banner tone="warning" message={t('simple.deaths.tooMany', { count: formatNumber(batch?.currentCount) })} />}
      </StepScaffold>
    );
  }

  if (step === 'cause') {
    const choices: Choice<Cause>[] = [
      { value: 'sick', label: t('simple.deaths.causes.sick'), icon: 'emoticon-sick-outline' },
      { value: 'heat', label: t('simple.deaths.causes.heat'), icon: 'thermometer-high' },
      { value: 'animal', label: t('simple.deaths.causes.animal'), icon: 'paw' },
      { value: 'unknown', label: t('simple.deaths.causes.unknown'), icon: 'help-circle-outline' },
    ];
    return (
      <StepScaffold
        icon="help-circle-outline"
        prompt={t('simple.deaths.causeQ')}
        onBack={() => setStep('count')}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('review') }}>
        <PictureChoice choices={choices} value={cause} onChange={setCause} />
      </StepScaffold>
    );
  }

  return (
    <StepScaffold
      icon="clipboard-check-outline"
      iconTint="success"
      prompt={t('simple.deaths.review', { batch: batch?.batchNumber ?? '', count: formatNumber(count) })}
      onBack={() => setStep('cause')}
      primary={{ label: t('simple.save'), icon: 'check-bold', onPress: save }}>
      <PictureChoice
        list
        value={null}
        onChange={(v) => setStep(v as Step)}
        choices={[
          ...(single ? [] : [{ value: 'batch', label: batch?.batchNumber ?? '', icon: 'bird' as const }]),
          { value: 'count', label: formatNumber(count), icon: 'heart-broken-outline', detail: t('simple.tiles.deaths') },
          { value: 'cause', label: t(`simple.deaths.causes.${cause}`), icon: 'help-circle-outline' },
        ]}
      />
    </StepScaffold>
  );
}
