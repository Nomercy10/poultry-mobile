import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { can } from '@/features/auth/permissions';
import { isActive, useBatches, useUpcomingVaccinations } from '@/features/chickens/api';
import { collected, useEggEntryForDay } from '@/features/eggs/api';
import { useWorkingFarm } from '@/features/farms/use-working-farm';
import { isLowStock, useFeedItems } from '@/features/feed/api';
import { api } from '@/lib/api/client';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { space, touch } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Feed used today, from GET /dashboard/feed-trend (needs DASHBOARD:READ). */
function useFeedUsedToday(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ['dashboard', 'feed-trend', farmId ?? 'all', 1],
    queryFn: ({ signal }) =>
      api
        .get<{ date: string; quantityUsed: number }[]>('/dashboard/feed-trend', {
          query: { farmId: farmId ?? undefined, days: 1 },
          signal,
        })
        .then((rows) => rows.at(-1)?.quantityUsed ?? 0),
    enabled: can(user, 'DASHBOARD') && can(user, 'FEED'),
  });
}

type Item = { key: string; done: boolean; icon: IconName; title: string; detail?: string; href: Href; warn?: boolean };

/** What still needs doing today, each item one tap from its form. */
export function TodayChecklist() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { farm, filterFarmId } = useWorkingFarm();
  const eggs = useEggEntryForDay(farm?.id ?? null, new Date());
  const feedUsed = useFeedUsedToday(filterFarmId);
  const feed = useFeedItems(filterFarmId);
  const batches = useBatches(filterFarmId);
  const due = useUpcomingVaccinations(0);

  const farmBatchIds = new Set((batches.data ?? []).filter(isActive).map((b) => b.id));
  const vaccinationsDue = (due.data ?? []).filter((v) => farmBatchIds.has(v.batchId));
  const lowFeed = (feed.data ?? []).filter((f) => f.currentQuantity > 0 && isLowStock(f));

  const items: Item[] = [];
  if (can(user, 'EGG', 'CREATE') && eggs.isSuccess) {
    items.push({
      key: 'eggs',
      done: !!eggs.data,
      icon: 'egg-outline',
      title: eggs.data ? t('today.eggsDone') : t('today.eggs'),
      detail: eggs.data ? t('today.eggsCount', { count: formatNumber(collected(eggs.data)) }) : undefined,
      href: '/eggs/new',
    });
  }
  if (can(user, 'FEED', 'UPDATE') && feedUsed.isSuccess) {
    items.push({
      key: 'feed',
      done: feedUsed.data > 0,
      icon: 'grain',
      title: feedUsed.data > 0 ? t('today.feedDone') : t('today.feed'),
      detail: feedUsed.data > 0 ? formatNumber(feedUsed.data) : undefined,
      href: { pathname: '/pick', params: { for: 'feedUsed' } },
    });
  }
  if (can(user, 'CHICKEN') && due.isSuccess) {
    for (const v of vaccinationsDue) {
      items.push({
        key: `vacc-${v.id}`,
        done: false,
        warn: true,
        icon: 'needle',
        title: t('today.vaccination', { name: v.vaccineName }),
        detail: v.batch?.batchNumber,
        href: { pathname: '/batches/[id]', params: { id: v.batchId } },
      });
    }
  }
  for (const f of lowFeed) {
    items.push({
      key: `low-${f.id}`,
      done: false,
      warn: true,
      icon: 'alert-outline',
      title: t('today.lowFeed', { name: f.feedType }),
      detail: `${formatNumber(f.currentQuantity)} ${t(`feed.units.${f.unit}`)}`,
      href: { pathname: '/feed/[id]', params: { id: f.id } },
    });
  }

  if (items.length === 0) return null;
  const left = items.filter((i) => !i.done).length;

  return (
    <Section title={left === 0 ? t('today.allDone') : t('today.title', { count: left })}>
      {items.map((item) => (
        <ChecklistRow key={item.key} item={item} />
      ))}
    </Section>
  );
}

function ChecklistRow({ item }: { item: Item }) {
  const { colors } = useTheme();
  const tint = item.done ? colors.success : item.warn ? colors.warning : colors.primary;
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      accessibilityRole="button"
      accessibilityLabel={[item.title, item.detail].filter(Boolean).join(', ')}
      accessibilityState={{ checked: item.done }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.background }]}>
      <Icon name={item.done ? 'check-circle' : item.icon} size={26} color={tint} />
      <View style={styles.text}>
        <Text variant="body" style={[styles.title, item.done && { color: colors.textMuted }]}>
          {item.title}
        </Text>
        {item.detail && (
          <Text variant="caption" tone="muted">
            {item.detail}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  text: { flex: 1, gap: 2 },
  title: { fontWeight: '500' },
});
