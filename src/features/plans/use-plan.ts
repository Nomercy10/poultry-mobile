import { useAuth } from '@/store/auth';

import type { Plan } from './catalog';
import { resolvePlan } from './resolve';

/** The signed-in user's plan. */
export function usePlan(): Plan {
  const user = useAuth((s) => s.user);
  return resolvePlan(user);
}
