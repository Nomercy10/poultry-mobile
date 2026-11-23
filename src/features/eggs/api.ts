import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { dayRange } from '@/lib/dates';
import { useAuth } from '@/store/auth';

/** EggInventory row (eggs module in the web repo). One per farm per day. */
export type EggEntry = {
  id: string;
  farmId: string;
  date: string;
  morningCollection: number;
  eveningCollection: number;
  brokenEggs: number;
  damagedEggs: number;
  soldEggs: number;
  /** Running stock after this day, computed by the server. */
  remainingEggs: number;
  notes: string | null;
  farm?: { id: string; name: string };
};

export type EggEntryInput = {
  date: string;
  morningCollection: number;
  eveningCollection: number;
  brokenEggs: number;
  damagedEggs: number;
  soldEggs: number;
  notes?: string;
};

export const eggKeys = {
  all: ['eggs'] as const,
  list: (farmId: string | null, from: string | null) => ['eggs', 'list', farmId ?? 'all', from ?? 'all'] as const,
  day: (farmId: string | null, day: string) => ['eggs', 'day', farmId ?? 'none', day] as const,
  stock: (farmId: string | null) => ['eggs', 'stock', farmId ?? 'none'] as const,
};

export function collected(e: Pick<EggEntry, 'morningCollection' | 'eveningCollection'>) {
  return e.morningCollection + e.eveningCollection;
}

/** Latest entries first. `from` (YYYY-MM-DD) applies the plan's history limit. */
export function useEggEntries(farmId: string | null, from: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: eggKeys.list(farmId, from),
    queryFn: ({ signal }) =>
      api.page<EggEntry>('/eggs', {
        query: { farmId: farmId ?? undefined, dateFrom: from ?? undefined, limit: 60, sortOrder: 'desc' },
        signal,
      }),
    enabled: can(user, 'EGG'),
  });
}

/** The entry for one local day, if there is one. */
export function useEggEntryForDay(farmId: string | null, day: Date) {
  const user = useAuth((s) => s.user);
  const range = dayRange(day);
  return useQuery({
    queryKey: eggKeys.day(farmId, range.dateFrom),
    queryFn: ({ signal }) =>
      api
        .page<EggEntry>('/eggs', { query: { farmId: farmId ?? undefined, ...range, limit: 1 }, signal })
        .then((r) => r.items[0] ?? null),
    enabled: !!farmId && can(user, 'EGG'),
  });
}

export function useEggStock(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: eggKeys.stock(farmId),
    queryFn: ({ signal }) =>
      api.get<{ farmId: string; currentStock: number }>(`/eggs/stock/${farmId}`, { signal }).then((r) => r.currentStock),
    enabled: !!farmId && can(user, 'EGG'),
  });
}

function useInvalidateDaily() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: eggKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
    ]);
}

/** Creates the day's entry, or updates it when `id` is given. */
export function useSaveEggEntry(farmId: string | null) {
  const invalidate = useInvalidateDaily();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EggEntryInput }) =>
      id ? api.put<EggEntry>(`/eggs/${id}`, input) : api.post<EggEntry>('/eggs', { ...input, farmId }),
    onSuccess: invalidate,
  });
}
