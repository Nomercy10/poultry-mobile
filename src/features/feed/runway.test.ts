import { addDays } from '@/lib/dates';

import type { FeedItem } from './api';
import { feedRunway } from './runway';

const today = new Date(2026, 10, 25);
const iso = (n: number) => addDays(today, n).toISOString();
const item = (over: Partial<FeedItem>): FeedItem => ({
  id: 'f',
  farmId: 'farm',
  feedType: 'Layer mash',
  purchaseDate: iso(-20),
  quantity: 1000,
  currentQuantity: 400,
  unit: 'KG',
  cost: 30000,
  lowStockThreshold: 0,
  notes: null,
  ...over,
});
const localDay = (n: number) => {
  const d = addDays(today, n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const use = (n: number, qty: number, feedType = 'Layer mash') => ({ Date: localDay(n), FeedType: feedType, QuantityUsed: String(qty), Unit: 'KG' });

describe('feedRunway', () => {
  it('works out days left, the order date, quantity and cost', () => {
    const usage = Array.from({ length: 30 }, (_, i) => use(-i, 50));
    const [r] = feedRunway([item({})], usage, today);
    expect(r.usedPerDay).toBe(50);
    expect(r.daysLeft).toBe(8);
    expect(r.status).toBe('soon');
    expect(r.orderBy?.getTime()).toBe(addDays(today, 5).getTime());
    expect(r.orderQuantity).toBe(1500);
    expect(r.unitPrice).toBe(30);
    expect(r.orderCost).toBe(45000);
  });

  it('adds up stock of the same feed bought more than once, priced at the latest buy', () => {
    const items = [item({ id: 'a', currentQuantity: 100, purchaseDate: iso(-40), cost: 25000 }), item({ id: 'b', currentQuantity: 50, feedType: 'layer mash ' })];
    const [r] = feedRunway(items, [use(0, 50), use(-1, 50)], today);
    expect(r.stock).toBe(150);
    expect(r.daysLeft).toBe(3);
    expect(r.status).toBe('orderNow');
    expect(r.unitPrice).toBe(30);
  });

  it('marks feed with no recorded use, and feed that has run out', () => {
    const rows = feedRunway([item({ feedType: 'Grower' }), item({ id: 'z', currentQuantity: 0 })], [use(0, 10)], today);
    expect(rows.map((r) => [r.feedType, r.status])).toEqual([
      ['Layer mash', 'out'],
      ['Grower', 'noUse'],
    ]);
  });
});
