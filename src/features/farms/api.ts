import { useQuery } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { useAuth } from '@/store/auth';

export type Farm = {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
};

export const farmKeys = {
  all: ['farms'] as const,
};

/** GET /farms needs DASHBOARD:READ on the server. */
export function useFarms() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: farmKeys.all,
    queryFn: ({ signal }) => api.page<Farm>('/farms', { query: { limit: 100 }, signal }).then((r) => r.items),
    enabled: can(user, 'DASHBOARD'),
    staleTime: 5 * 60_000,
  });
}
