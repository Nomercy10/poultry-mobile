import { useQuery } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { useAuth } from '@/store/auth';

type FeedStockItem = {
  id: string;
  farmId: string;
  farmName: string;
  feedType: string;
  currentQuantity: number;
  unit: string;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
};

/** GET /inventory/summary */
export type InventorySummary = {
  eggStock: { farmId: string; farmName: string; currentStock: number }[];
  feedStock: FeedStockItem[];
  alerts: { lowStockFeed: FeedStockItem[]; outOfStockFeed: FeedStockItem[] };
};

export function useInventorySummary(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ['inventory', 'summary', farmId ?? 'all'],
    queryFn: ({ signal }) =>
      api.get<InventorySummary>('/inventory/summary', { query: { farmId: farmId ?? undefined }, signal }),
    enabled: can(user, 'INVENTORY'),
  });
}
