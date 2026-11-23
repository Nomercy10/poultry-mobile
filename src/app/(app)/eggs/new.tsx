import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateStepper } from '@/components/ui/date-stepper';
import { FormHeader } from '@/components/ui/form-header';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { can } from '@/features/auth/permissions';
import { type EggEntry, useEggEntryForDay, useSaveEggEntry } from '@/features/eggs/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { errorMessage } from '@/lib/api/messages';
import { leave } from '@/lib/navigation';
import { localDayIso, startOfLocalDay } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';

type Counts = {
  morningCollection?: number;
  eveningCollection?: number;
  brokenEggs?: number;
  damagedEggs?: number;
  soldEggs?: number;
};

const EMPTY: Counts = { morningCollection: 0, eveningCollection: 0, brokenEggs: 0, damagedEggs: 0, soldEggs: 0 };

function fromEntry(e: EggEntry): Counts {
  return {
    morningCollection: e.morningCollection,
    eveningCollection: e.eveningCollection,
    brokenEggs: e.brokenEggs,
    damagedEggs: e.damagedEggs,
    soldEggs: e.soldEggs,
  };
}

/** One screen for adding or changing a day's egg collection (one entry per farm per day). */
export default function EggEntryScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ date?: string }>();
  const user = useAuth((s) => s.user);
  const { farm } = useWorkingFarm();
  const [day, setDay] = useState(() => startOfLocalDay(params.date ? new Date(params.date) : new Date()));
  const existing = useEggEntryForDay(farm?.id ?? null, day);
  const entry = existing.data ?? null;
  const save = useSaveEggEntry(farm?.id ?? null);

  // Reload the form whenever the day or its entry changes.
  const formKey = `${day.getTime()}:${entry?.id ?? 'new'}:${existing.isPending}`;
  const [loadedKey, setLoadedKey] = useState(formKey);
  const [counts, setCounts] = useState<Counts>(entry ? fromEntry(entry) : EMPTY);
  const [notes, setNotes] = useState(entry?.notes ?? '');
  if (formKey !== loadedKey) {
    setLoadedKey(formKey);
    setCounts(entry ? fromEntry(entry) : EMPTY);
    setNotes(entry?.notes ?? '');
  }

  const canWrite = entry ? can(user, 'EGG', 'UPDATE') : can(user, 'EGG', 'CREATE');
  const set = (key: keyof Counts) => (value: number | undefined) => setCounts((c) => ({ ...c, [key]: value }));
  const missing = Object.values(counts).some((v) => v === undefined);
  const collectedToday = (counts.morningCollection ?? 0) + (counts.eveningCollection ?? 0);
  const takenOut = (counts.brokenEggs ?? 0) + (counts.damagedEggs ?? 0) + (counts.soldEggs ?? 0);

  async function onSave() {
    if (missing) return;
    await save.mutateAsync({
      id: entry?.id,
      input: {
        date: localDayIso(day),
        morningCollection: counts.morningCollection ?? 0,
        eveningCollection: counts.eveningCollection ?? 0,
        brokenEggs: counts.brokenEggs ?? 0,
        damagedEggs: counts.damagedEggs ?? 0,
        soldEggs: counts.soldEggs ?? 0,
        notes: notes.trim() || undefined,
      },
    });
    leave('/stock');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        kind="close"
        title={entry ? t('eggs.editTitle') : t('eggs.newTitle')}
        subtitle={farm?.name}
      />

      <DateStepper label={t('form.date')} value={day} onChange={(d) => {
          setDay(startOfLocalDay(d));
          save.reset();
        }}
      />

      {entry && <Banner tone="info" message={t('eggs.alreadyRecorded')} />}
      {!farm && <Banner tone="warning" message={t('form.noFarm')} />}

      <Text variant="heading">{t('eggs.collected')}</Text>
      <NumberField label={t('eggs.morning')} value={counts.morningCollection} onChange={set('morningCollection')} step={30} unit={t('eggs.unit')} hint={t('eggs.trayHint')} testID="egg-morning" />
      <NumberField label={t('eggs.evening')} value={counts.eveningCollection} onChange={set('eveningCollection')} step={30} unit={t('eggs.unit')} testID="egg-evening" />

      <Text variant="heading">{t('eggs.out')}</Text>
      <NumberField label={t('eggs.broken')} value={counts.brokenEggs} onChange={set('brokenEggs')} unit={t('eggs.unit')} />
      <NumberField label={t('eggs.damaged')} value={counts.damagedEggs} onChange={set('damagedEggs')} unit={t('eggs.unit')} />
      <NumberField label={t('eggs.sold')} value={counts.soldEggs} onChange={set('soldEggs')} step={30} unit={t('eggs.unit')} />

      <TextField label={t('form.notesOptional')} value={notes} onChangeText={setNotes} multiline />

      <Card style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text variant="caption" tone="muted">{t('eggs.collectedToday')}</Text>
          <Text variant="heading" numeric>{formatNumber(collectedToday)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="caption" tone="muted">{t('eggs.takenOut')}</Text>
          <Text variant="heading" numeric>{formatNumber(takenOut)}</Text>
        </View>
      </Card>

      {save.isError && <Banner message={errorMessage(save.error, t)} />}
      {existing.isError && (
        <Banner message={errorMessage(existing.error, t)} actionLabel={t('common.retry')} onAction={() => void existing.refetch()} />
      )}
      {!canWrite && <Banner tone="warning" message={t('form.noPermission')} />}

      <Button
        label={entry ? t('form.saveChanges') : t('form.save')}
        icon="check"
        onPress={() => void onSave().catch(() => {})}
        loading={save.isPending}
        disabled={!farm || missing || !canWrite || existing.isPending}
        testID="egg-save"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: space.lg },
  summaryItem: { flex: 1, gap: 2 },
});
