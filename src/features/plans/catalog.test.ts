import { allowedFarms, canAddBatch, cheapestPlanWith, hasFeature, historyStart, PLANS } from './catalog';
import { resolvePlanId } from './resolve';

describe('plan catalog', () => {
  it('never paywalls daily recording: Free has a farm and two active batches', () => {
    expect(PLANS.free.limits.farms).toBe(1);
    expect(canAddBatch(PLANS.free, 1)).toBe(true);
    expect(canAddBatch(PLANS.free, 2)).toBe(false);
    expect(canAddBatch(PLANS.pro, 40)).toBe(true);
  });

  it('matches the proposed prices', () => {
    expect([PLANS.pro.priceMonthly, PLANS.pro.priceYearly]).toEqual([199, 1999]);
    expect([PLANS.business.priceMonthly, PLANS.business.priceYearly]).toEqual([499, 4999]);
    expect(PLANS.integrator.priceMonthly).toBeNull();
  });

  it('puts money features on paid plans only', () => {
    expect(hasFeature(PLANS.free, 'exports')).toBe(false);
    expect(hasFeature(PLANS.pro, 'exports')).toBe(true);
    expect(hasFeature(PLANS.pro, 'payroll')).toBe(false);
    expect(cheapestPlanWith('batchPerformance')).toBe('pro');
    expect(cheapestPlanWith('gstInvoices')).toBe('business');
  });

  it('splits farms into allowed and locked', () => {
    expect(allowedFarms(PLANS.free, ['a', 'b', 'c'])).toEqual({ allowed: ['a'], locked: ['b', 'c'] });
    expect(allowedFarms(PLANS.integrator, ['a', 'b'])).toEqual({ allowed: ['a', 'b'], locked: [] });
  });

  it('limits Free history to 12 months', () => {
    expect(historyStart(PLANS.free, new Date(2026, 10, 23))).toBe('2025-11-23');
    expect(historyStart(PLANS.pro)).toBeNull();
  });
});

describe('resolvePlanId', () => {
  it('maps the demo accounts and defaults others to Business', () => {
    expect(resolvePlanId({ email: 'Free@Demo.test' })).toBe('free');
    expect(resolvePlanId({ email: 'pro@demo.test' })).toBe('pro');
    expect(resolvePlanId({ email: 'admin@example.com' })).toBe('business');
    expect(resolvePlanId(null)).toBe('free');
  });

  it('prefers a plan sent by the server', () => {
    expect(resolvePlanId({ email: 'free@demo.test', plan: 'pro' })).toBe('pro');
    expect(resolvePlanId({ email: 'x@y.z', plan: 'nonsense' })).toBe('business');
  });
});
