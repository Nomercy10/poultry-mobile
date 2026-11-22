import { useQuery } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { useAuth } from '@/store/auth';

/** GET /dashboard/summary (dashboard.service.ts in the web repo). */
export type DashboardSummary = {
  todaysEggs: number;
  totalChickens: number;
  healthyChickens: number;
  sickChickens: number;
  todaysSales: number;
  todaysExpenses: number;
  currentEggInventory: number;
  monthlyProfit: number;
  monthlyLoss: number;
};

export const dashboardKeys = {
  summary: (farmId: string | null) => ['dashboard', 'summary', farmId ?? 'all'] as const,
};

export function useDashboardSummary(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: dashboardKeys.summary(farmId),
    queryFn: ({ signal }) =>
      api.get<DashboardSummary>('/dashboard/summary', { query: { farmId: farmId ?? undefined }, signal }),
    enabled: can(user, 'DASHBOARD'),
  });
}
