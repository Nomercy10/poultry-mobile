import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { LanguageButton } from '@/components/language-button';
import { BigTile } from '@/components/simple/big-tile';
import { Banner } from '@/components/ui/banner';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { isActive, useBatches, useUpcomingVaccinations } from '@/features/chickens/api';
import { collected, useEggEntryForDay } from '@/features/eggs/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { usePendingSave } from '@/features/simple/pending-save';
import { useFeedUsedToday } from '@/features/today/today-checklist';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space } from '@/theme/tokens';

/** Simple mode home: a few big picture tiles, each showing whether it's done today. */
export default function SimpleHome() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { farm, filterFarmId } = useWorkingFarm();
  const eggs = useEggEntryForDay(farm?.id ?? null, new Date());
  const feedUsed = useFeedUsedToday(filterFarmId);
  const batches = useBatches(filterFarmId);
  const due = useUpcomingVaccinations(0);
  const failed = usePendingSave((s) => s.failed);
  const clearFailure = usePendingSave((s) => s.clearFailure);

  const activeIds = new Set((batches.data ?? []).filter(isActive).map((b) => b.id));
  const dueCount = (due.data ?? []).filter((v) => activeIds.has(v.batchId)).length;
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.flex}>
          {t('simple.greeting', { name: firstName })}
        </Text>
        <LanguageButton />
      </View>

      {failed && (
        <Banner
          message={`${failed.offline ? t('simple.noSignal') : t('simple.notSaved')} (${failed.summary})`}
          actionLabel={t('common.close')}
          onAction={clearFailure}
        />
      )}

      <View style={styles.grid}>
        {can(user, 'EGG', 'CREATE') && (
          <BigTile
            label={t('simple.tiles.eggs')}
            icon="egg-outline"
            done={!!eggs.data}
            status={eggs.data ? formatNumber(collected(eggs.data)) : t('simple.notDone')}
            onPress={() => router.push('/simple/eggs')}
            testID="tile-eggs"
          />
        )}
        {can(user, 'CHICKEN', 'UPDATE') && (
          <BigTile
            label={t('simple.tiles.deaths')}
            icon="heart-broken-outline"
            tint="danger"
            onPress={() => router.push('/simple/deaths')}
            testID="tile-deaths"
          />
        )}
        {can(user, 'FEED', 'UPDATE') && (
          <BigTile
            label={t('simple.tiles.feed')}
            icon="grain"
            done={(feedUsed.data ?? 0) > 0}
            status={(feedUsed.data ?? 0) > 0 ? formatNumber(feedUsed.data) : t('simple.notDone')}
            onPress={() => router.push('/simple/feed')}
            testID="tile-feed"
          />
        )}
        {can(user, 'CHICKEN', 'UPDATE') && (
          <BigTile
            label={t('simple.tiles.vaccine')}
            icon="needle"
            done={due.isSuccess && dueCount === 0}
            status={dueCount > 0 ? String(dueCount) : undefined}
            onPress={() => router.push('/simple/vaccine')}
            testID="tile-vaccine"
          />
        )}
        <BigTile label={t('simple.tiles.me')} icon="account-circle-outline" onPress={() => router.push('/simple/me')} testID="tile-me" />
      </View>

      <Text variant="caption" tone="muted" style={styles.hint}>
        {t('simple.hint')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  hint: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
