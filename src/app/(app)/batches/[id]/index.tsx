import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormHeader } from '@/components/ui/form-header';
import { Icon } from '@/components/ui/icon';
import { KpiCard } from '@/components/ui/kpi-card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import {
  ageInDays,
  type BatchDetail,
  type ChickenEvent,
  type EventType,
  useBatch,
  useMarkVaccination,
  type Vaccination,
} from '@/features/chickens/api';
import { EVENT_ICON, STATUS_TONE } from '@/features/chickens/status';
import { hasFeature } from '@/features/plans/catalog';
import { LockedFeature } from '@/features/plans/locked-feature';
import { usePlan } from '@/features/plans/use-plan';
import { errorMessage } from '@/lib/api/messages';
import { formatDay, relativeDay } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { radius, space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const ACTIONS: EventType[] = ['MORTALITY', 'WEIGHT_CHECK', 'MEDICINE', 'VACCINATION', 'NOTE', 'STATUS_CHANGE'];

export default function BatchDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const plan = usePlan();
  const batch = useBatch(id);
  const b = batch.data;
  const canUpdate = can(user, 'CHICKEN', 'UPDATE');

  return (
    <Screen edges={['top', 'bottom']} refreshing={batch.isRefetching} onRefresh={() => void batch.refetch()}>
      <FormHeader
        title={b?.batchNumber ?? t('batches.title')}
        subtitle={b ? `${b.breed} · ${b.farm?.name ?? ''}` : undefined}
        right={b && <Badge label={t(`batches.status.${b.status}`)} tone={STATUS_TONE[b.status]} />}
      />
      {batch.isPending && <ActivityIndicator />}
      {batch.isError && (
        <Banner message={errorMessage(batch.error, t)} actionLabel={t('common.retry')} onAction={() => void batch.refetch()} />
      )}
      {b && (
        <>
          <View style={styles.row}>
            <KpiCard label={t('batches.birdsNow')} value={formatNumber(b.currentCount)} icon="bird" />
            <KpiCard label={t('batches.deaths')} value={formatNumber(b.mortalityCount)} icon="heart-broken-outline" tone={b.mortalityCount > 0 ? 'danger' : 'default'} />
          </View>
          <View style={styles.row}>
            <KpiCard label={t('batches.age')} value={t('batches.ageValue', { count: ageInDays(b) })} icon="calendar-clock" />
            <KpiCard label={t('batches.avgWeight')} value={b.averageWeightKg ? `${formatNumber(b.averageWeightKg)} kg` : '—'} icon="scale" />
          </View>

          {hasFeature(plan, 'batchPerformance') ? <Performance b={b} /> : <LockedFeature feature="batchPerformance" />}

          {canUpdate && (
            <View style={styles.actions}>
              {ACTIONS.map((type) => (
                <ActionTile key={type} type={type} batchId={b.id} />
              ))}
            </View>
          )}

          <Vaccinations b={b} canUpdate={canUpdate} />

          <Section title={t('batches.history')}>
            {b.events.length === 0 ? (
              <ListRow title={t('batches.noEvents')} />
            ) : (
              b.events.map((e) => <ListRow key={e.id} icon={EVENT_ICON[e.type]} title={eventTitle(e, t)} subtitle={eventSubtitle(e)} />)
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

function eventTitle(e: ChickenEvent, t: T) {
  const name = t(`batches.events.${e.type}`);
  if (e.type === 'MORTALITY' && e.quantity) return `${name}: ${formatNumber(e.quantity)}`;
  if (e.type === 'WEIGHT_CHECK' && e.weightKg) return `${name}: ${formatNumber(e.weightKg)} kg`;
  if (e.type === 'MEDICINE' && e.medicineName) return `${name}: ${e.medicineName}`;
  return name;
}

function eventSubtitle(e: ChickenEvent) {
  return [formatDay(e.eventDate), e.description].filter(Boolean).join(' · ');
}

function Performance({ b }: { b: BatchDetail }) {
  const { t } = useTranslation();
  const liveability = b.initialCount > 0 ? (b.currentCount / b.initialCount) * 100 : 0;
  return (
    <Card style={styles.perf}>
      <Text variant="label">{t('batches.performance')}</Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="caption" tone="muted">{t('batches.liveability')}</Text>
          <Text variant="heading" numeric>{formatNumber(Number(liveability.toFixed(1)))}%</Text>
        </View>
        <View style={styles.flex}>
          <Text variant="caption" tone="muted">{t('batches.mortalityRate')}</Text>
          <Text variant="heading" numeric>{formatNumber(Number((100 - liveability).toFixed(1)))}%</Text>
        </View>
      </View>
      <Text variant="caption" tone="muted">{t('batches.performanceMore')}</Text>
    </Card>
  );
}

function ActionTile({ type, batchId }: { type: EventType; batchId: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/batches/[id]/event', params: { id: batchId, type } })}
      accessibilityRole="button"
      accessibilityLabel={t(`batches.actions.${type}`)}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: colors.border, backgroundColor: pressed ? colors.primarySoft : colors.card },
      ]}>
      <Icon name={EVENT_ICON[type]} size={26} color={type === 'MORTALITY' ? colors.danger : colors.primary} />
      <Text variant="caption" style={styles.tileText} numberOfLines={2}>
        {t(`batches.actions.${type}`)}
      </Text>
    </Pressable>
  );
}

function Vaccinations({ b, canUpdate }: { b: BatchDetail; canUpdate: boolean }) {
  const { t } = useTranslation();
  const mark = useMarkVaccination(b.id);
  const scheduled = b.vaccinations.filter((v) => v.status === 'SCHEDULED');
  const done = b.vaccinations.filter((v) => v.status !== 'SCHEDULED');

  const when = (v: Vaccination) => {
    const rel = relativeDay(v.scheduledDate);
    const overdue = new Date(v.scheduledDate) < new Date() && !rel;
    if (overdue) return t('batches.overdue', { date: formatDay(v.scheduledDate) });
    return rel ? t(`common.${rel}`) : formatDay(v.scheduledDate);
  };

  return (
    <View style={styles.vacc}>
      <Section title={t('batches.vaccinations')}>
        {scheduled.length === 0 && done.length === 0 && <ListRow title={t('batches.noVaccinations')} />}
        {scheduled.map((v) => (
          <View key={v.id} style={styles.vaccRow}>
            <View style={styles.flex}>
              <Text variant="body" style={styles.bold}>{v.vaccineName}</Text>
              <Text variant="caption" tone="muted">{when(v)}</Text>
            </View>
            {canUpdate && (
              <>
                <Button label={t('batches.missed')} variant="ghost" compact onPress={() => mark.mutate({ vaccinationId: v.id, status: 'MISSED' })} disabled={mark.isPending} />
                <Button label={t('batches.given')} icon="check" compact onPress={() => mark.mutate({ vaccinationId: v.id, status: 'ADMINISTERED' })} disabled={mark.isPending} />
              </>
            )}
          </View>
        ))}
        {done.map((v) => (
          <ListRow
            key={v.id}
            icon={v.status === 'ADMINISTERED' ? 'check-circle-outline' : 'close-circle-outline'}
            title={v.vaccineName}
            subtitle={v.status === 'ADMINISTERED' && v.administeredDate ? t('batches.givenOn', { date: formatDay(v.administeredDate) }) : t('batches.missedOn', { date: formatDay(v.scheduledDate) })}
          />
        ))}
      </Section>
      {mark.isError && <Banner message={errorMessage(mark.error, t)} />}
      {canUpdate && (
        <Button
          label={t('batches.scheduleVaccination')}
          icon="calendar-plus"
          variant="secondary"
          onPress={() => router.push({ pathname: '/batches/[id]/vaccination', params: { id: b.id } })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  flex: { flex: 1 },
  bold: { fontWeight: '500' },
  perf: { gap: space.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '31.5%',
    flexGrow: 1,
    minHeight: touch.min + space.xl,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    padding: space.sm,
  },
  tileText: { textAlign: 'center' },
  vacc: { gap: space.md },
  vaccRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
});
