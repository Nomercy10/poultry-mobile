import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { useAuth } from '@/store/auth';

export type FeedUnit = 'KG' | 'BAG' | 'LITRE' | 'TON';
export const FEED_UNITS: FeedUnit[] = ['KG', 'BAG', 'LITRE', 'TON'];

/** A feed purchase and what's left of it (FeedInventory in the web repo). */
export type FeedItem = {
  id: string;
  farmId: string;
  feedType: string;
  purchaseDate: string;
  quantity: number;
  currentQuantity: number;
  unit: FeedUnit;
  cost: number;
  lowStockThreshold: number;
  notes: string | null;
  farm?: { id: string; name: string };
  supplier?: { id: string; name: string } | null;
};

export type FeedConsumption = { id: string; date: string; quantityUsed: number; notes: string | null };
export type FeedDetail = FeedItem & { consumptions: FeedConsumption[] };

export type FeedPurchaseInput = {
  farmId: string;
  feedType: string;
  purchaseDate: string;
  quantity: number;
  unit: FeedUnit;
  cost: number;
  lowStockThreshold: number;
  notes?: string;
};

export const feedKeys = {
  all: ['feed'] as const,
  list: (farmId: string | null) => ['feed', 'list', farmId ?? 'all'] as const,
  detail: (id: string) => ['feed', 'detail', id] as const,
};

export function isLowStock(f: Pick<FeedItem, 'currentQuantity' | 'lowStockThreshold'>) {
  return f.currentQuantity <= f.lowStockThreshold;
}

export function useFeedItems(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: feedKeys.list(farmId),
    queryFn: ({ signal }) =>
      api.page<FeedItem>('/feed', { query: { farmId: farmId ?? undefined, limit: 100 }, signal }).then((r) => r.items),
    enabled: can(user, 'FEED'),
  });
}

export function useFeedItem(id: string) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: feedKeys.detail(id),
    queryFn: ({ signal }) => api.get<FeedDetail>(`/feed/${id}`, { signal }),
    enabled: !!id && can(user, 'FEED'),
  });
}

function useInvalidateFeed() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: feedKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useCreateFeedPurchase() {
  const invalidate = useInvalidateFeed();
  return useMutation({
    mutationFn: (input: FeedPurchaseInput) => api.post<FeedItem>('/feed', input),
    onSuccess: invalidate,
  });
}

export function useRecordFeedUse(feedId: string) {
  const invalidate = useInvalidateFeed();
  return useMutation({
    mutationFn: (input: { date: string; quantityUsed: number; notes?: string }) =>
      api.post<FeedConsumption>(`/feed/${feedId}/consumption`, input),
    onSuccess: invalidate,
  });
}
