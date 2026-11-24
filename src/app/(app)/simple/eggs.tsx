import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { BigCounter } from '@/components/simple/big-counter';
import { StepScaffold } from '@/components/simple/step-scaffold';
import { SuccessView } from '@/components/simple/success-view';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type EggEntry, eggKeys, useEggEntryForDay } from '@/features/eggs/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { usePendingSave } from '@/features/simple/pending-save';
import { api } from '@/lib/api/client';
import { localDayIso } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { queryClient } from '@/lib/query-client';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const TRAY = 30;
type Step = 'good' | 'broken' | 'review' | 'done';

/** Morning before 1 pm, evening after (docs/languages-and-easy-ui.md §3.1). */
function slotNow(now = new Date()): 'morningCollection' | 'eveningCollection' {
  return now.getHours() < 13 ? 'morningCollection' : 'eveningCollection';
}

export default function SimpleEggs() {
  const { t } = useTranslation();
  const { farm } = useWorkingFarm();
  const today = useEggEntryForDay(farm?.id ?? null, new Date());
  return today.isPending ? null : <EggFlow key={today.data?.id ?? 'new'} entry={today.data ?? null} farmId={farm?.id ?? null} t={t} />;
}

function EggFlow({ entry, farmId, t }: { entry: EggEntry | null; farmId: string | null; t: ReturnType<typeof useTranslation>['t'] }) {
  const { colors } = useTheme();
  const schedule = usePendingSave((s) => s.schedule);
  const slot = slotNow();
  const startGood = entry?.[slot] ?? 0;
  const [trays, setTrays] = useState(Math.floor(startGood / TRAY));
  const [loose, setLoose] = useState(startGood % TRAY);
  const [broken, setBroken] = useState(entry ? entry.brokenEggs + entry.damagedEggs : 0);
  const [step, setStep] = useState<Step>('good');
  const good = trays * TRAY + loose;
  const savedSay = t('simple.eggs.savedSay', { good: formatNumber(good) });
  const slotIcon = slot === 'morningCollection' ? 'weather-sunset-up' : 'weather-sunset-down';

  function save() {
    if (!farmId) return;
    const body = {
      date: localDayIso(),
      [slot]: good,
      brokenEggs: broken,
      damagedEggs: 0,
    };
    schedule(savedSay, async () => {
      if (entry) await api.put(`/eggs/${entry.id}`, body);
      else
        await api.post('/eggs', {
          farmId,
          morningCollection: 0,
          eveningCollection: 0,
          soldEggs: 0,
          ...body,
        });
      await queryClient.invalidateQueries({ queryKey: eggKeys.all });
    });
    setStep('done');
  }

  if (step === 'done') return <SuccessView summary={savedSay} />;

  if (step === 'good') {
    return (
      <StepScaffold
        icon="egg-outline"
        prompt={t('simple.eggs.goodQ')}
        onBack={() => router.back()}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('broken') }}
        testID="simple-eggs-good">
        <View style={styles.slot}>
          <Icon name={slotIcon} size={28} color={colors.warning} />
        </View>
        {entry && <Banner tone="info" message={t('simple.eggs.alreadyToday')} />}
        <BigCounter label={t('simple.eggs.trays')} icon="view-grid-outline" value={trays} onChange={setTrays} testID="trays" />
        <BigCounter
          label={t('simple.eggs.loose')}
          icon="egg-outline"
          value={loose}
          max={TRAY - 1}
          onChange={(n) => setLoose(n)}
          testID="loose"
        />
        <Text variant="display" numeric style={styles.total} accessibilityLiveRegion="polite">
          {t('simple.eggs.total', { total: formatNumber(good) })}
        </Text>
      </StepScaffold>
    );
  }

  if (step === 'broken') {
    return (
      <StepScaffold
        icon="egg-off-outline"
        iconTint="danger"
        prompt={t('simple.eggs.brokenQ')}
        onBack={() => setStep('good')}
        primary={{ label: t('common.next'), icon: 'arrow-right', onPress: () => setStep('review') }}>
        <Pressable
          onPress={() => {
            setBroken(0);
            setStep('review');
          }}
          accessibilityRole="button"
          accessibilityLabel={t('simple.eggs.none')}
          style={[styles.none, { borderColor: colors.success, backgroundColor: colors.successSoft }]}>
          <Icon name="check-circle-outline" size={36} color={colors.success} />
          <Text variant="title">{t('simple.eggs.none')}</Text>
        </Pressable>
        <BigCounter label={t('eggs.broken')} icon="egg-off-outline" value={broken} onChange={setBroken} />
      </StepScaffold>
    );
  }

  const review = t('simple.eggs.review', { good: formatNumber(good), broken: formatNumber(broken) });
  return (
    <StepScaffold
      icon="clipboard-check-outline"
      iconTint="success"
      prompt={review}
      onBack={() => setStep('broken')}
      primary={{ label: t('simple.save'), icon: 'check-bold', onPress: save, disabled: !farmId }}>
      <Card style={styles.review}>
        <ReviewRow icon="egg-outline" label={t('simple.eggs.trays')} value={`${formatNumber(trays)} + ${formatNumber(loose)}`} onPress={() => setStep('good')} />
        <ReviewRow icon="egg-outline" label={t('eggs.collected')} value={formatNumber(good)} onPress={() => setStep('good')} />
        <ReviewRow icon="egg-off-outline" label={t('eggs.broken')} value={formatNumber(broken)} onPress={() => setStep('broken')} />
      </Card>
    </StepScaffold>
  );
}

function ReviewRow({ icon, label, value, onPress }: { icon: 'egg-outline' | 'egg-off-outline'; label: string; value: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={styles.reviewRow}>
      <Icon name={icon} size={30} color={colors.primary} />
      <Text variant="heading" style={styles.flex}>
        {label}
      </Text>
      <Text variant="title" numeric>
        {value}
      </Text>
      <Icon name="pencil-outline" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center' },
  total: { textAlign: 'center' },
  none: { minHeight: 84, borderRadius: radius.lg, borderWidth: 2, flexDirection: 'row', gap: space.md, alignItems: 'center', justifyContent: 'center' },
  review: { gap: space.md },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56 },
  flex: { flex: 1 },
});
