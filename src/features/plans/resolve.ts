import type { Me } from '@/features/auth/types';

import { PLANS, type Plan, type PlanId } from './catalog';

// The backend has no plans yet (they arrive with the organisation layer in M4–M5).
// Until then the two demo accounts created by `npm run backend:demo` get a fixed
// plan, and every other account (the web repo's seeded admin and worker) gets
// Business, so they keep seeing everything.
export const DEMO_PLAN_BY_EMAIL: Readonly<Record<string, PlanId>> = {
  'free@demo.test': 'free',
  'pro@demo.test': 'pro',
};

const DEFAULT_PLAN: PlanId = 'business';

type PlanUser = Pick<Me, 'email'> & { plan?: string | null };

export function resolvePlanId(user: PlanUser | null): PlanId {
  if (!user) return 'free';
  // Prefer the server's answer once it sends one.
  if (user.plan && user.plan in PLANS) return user.plan as PlanId;
  return DEMO_PLAN_BY_EMAIL[user.email.toLowerCase()] ?? DEFAULT_PLAN;
}

export function resolvePlan(user: PlanUser | null): Plan {
  return PLANS[resolvePlanId(user)];
}
