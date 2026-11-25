// Plans and what each one unlocks, from the pricing proposal (Nov 2026).
// Prices are GST-inclusive rupees. Until the CEO approves the prices and the
// backend stores plans (milestone M5), this file is the single source of truth.

export type PlanId = 'free' | 'pro' | 'business' | 'integrator';

/** Paid features, named after what the user gets. Daily recording is never one of them. */
export type FeatureKey =
  | 'fullHistory'
  | 'batchPerformance' // FCR, laying %, liveability against breed standard
  | 'batchProfit'
  | 'exports' // PDF and Excel
  | 'paymentReminders' // automatic WhatsApp reminders
  | 'brandedBills'
  | 'gstInvoices'
  | 'multiFarmDashboard'
  | 'payroll'
  | 'webDashboard'
  | 'feedStockAlerts'
  | 'cashForecast' // cash for the next 30, 60, 90 days
  | 'feedPlanner' // when to reorder feed, how much, what it costs
  | 'latePayers' // flags customers who keep paying late
  | 'taxPack' // yearly summary and export for the CA
  | 'renewalsUnlimited' // Free keeps 3 open renewals
  | 'creditLimits'; // per-customer credit limit and warnings

export type PlanLimits = {
  farms: number;
  activeBatches: number;
  /** Owner included. */
  people: number;
  /** Months of records visible in lists; Infinity = everything. */
  historyMonths: number;
  /** Days covered by on-screen reports. */
  reportDays: number;
};

export type Plan = {
  id: PlanId;
  /** null = priced by quote. */
  priceMonthly: number | null;
  priceYearly: number | null;
  limits: PlanLimits;
  features: readonly FeatureKey[];
};

const PRO_FEATURES: FeatureKey[] = [
  'fullHistory',
  'batchPerformance',
  'batchProfit',
  'exports',
  'paymentReminders',
  'brandedBills',
  'webDashboard',
  'feedStockAlerts',
  'cashForecast',
  'feedPlanner',
  'latePayers',
  'taxPack',
  'renewalsUnlimited',
  'creditLimits',
];

const BUSINESS_FEATURES: FeatureKey[] = [...PRO_FEATURES, 'gstInvoices', 'multiFarmDashboard', 'payroll'];

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    limits: { farms: 1, activeBatches: 2, people: 2, historyMonths: 12, reportDays: 90 },
    features: [],
  },
  pro: {
    id: 'pro',
    priceMonthly: 199,
    priceYearly: 1999,
    limits: { farms: 1, activeBatches: Infinity, people: 3, historyMonths: Infinity, reportDays: Infinity },
    features: PRO_FEATURES,
  },
  business: {
    id: 'business',
    priceMonthly: 499,
    priceYearly: 4999,
    limits: { farms: 5, activeBatches: Infinity, people: 15, historyMonths: Infinity, reportDays: Infinity },
    features: BUSINESS_FEATURES,
  },
  integrator: {
    id: 'integrator',
    priceMonthly: null,
    priceYearly: null,
    limits: {
      farms: Infinity,
      activeBatches: Infinity,
      people: Infinity,
      historyMonths: Infinity,
      reportDays: Infinity,
    },
    features: BUSINESS_FEATURES,
  },
};

/** Order shown on the plans screen. */
export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'business', 'integrator'];

export function hasFeature(plan: Plan, feature: FeatureKey): boolean {
  return plan.features.includes(feature);
}

/** The cheapest plan that includes a feature, for "Available on Pro" labels. */
export function cheapestPlanWith(feature: FeatureKey): PlanId {
  return PLAN_ORDER.find((id) => hasFeature(PLANS[id], feature)) ?? 'business';
}

export function canAddBatch(plan: Plan, activeBatchCount: number): boolean {
  return activeBatchCount < plan.limits.activeBatches;
}

/** Farms the plan lets the user work with, in the order the server returned them. */
export function allowedFarms<T>(plan: Plan, farms: readonly T[]): { allowed: T[]; locked: T[] } {
  const n = Number.isFinite(plan.limits.farms) ? plan.limits.farms : farms.length;
  return { allowed: farms.slice(0, n), locked: farms.slice(n) };
}

/** Earliest date (YYYY-MM-DD) whose records the plan shows, or null for no limit. */
export function historyStart(plan: Plan, today: Date = new Date()): string | null {
  const months = plan.limits.historyMonths;
  if (!Number.isFinite(months)) return null;
  const start = new Date(today);
  start.setMonth(start.getMonth() - months);
  return toIsoDate(start);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
