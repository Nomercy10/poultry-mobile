// Feed runway: how many days each feed lasts at the current rate of use, when to
// order more, how much, and what it will cost at the last price paid.

import { addDays, daysBetween, startOfLocalDay } from '@/lib/dates';

import type { FeedItem } from './api';

/** Days of use the average is taken over. */
export const USAGE_DAYS = 30;
/** Days between ordering feed and it arriving. */
export const LEAD_DAYS = 3;
/** An order covers this many days of use. */
export const COVER_DAYS = 30;

/** One row of the server's feed-consumption report (`GET /reports/feed-consumption?format=json`). */
export type FeedUseRow = { Date: string; FeedType: string; QuantityUsed: string | number; Unit: string };

export type RunwayStatus = 'out' | 'orderNow' | 'soon' | 'ok' | 'noUse';

export type FeedRunway = {
  feedType: string;
  unit: string;
  stock: number;
  usedPerDay: number;
  /** null when no use was recorded. */
  daysLeft: number | null;
  runsOutOn: Date | null;
  orderBy: Date | null;
  orderQuantity: number;
  /** Price of one unit at the latest purchase, or null if unknown. */
  unitPrice: number | null;
  orderCost: number | null;
  status: RunwayStatus;
};

const key = (feedType: string, unit: string) => `${feedType.trim().toLowerCase()}|${unit}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function feedRunway(items: FeedItem[], usage: FeedUseRow[], today: Date = new Date()): FeedRunway[] {
  const day0 = startOfLocalDay(today);
  const from = addDays(day0, -USAGE_DAYS);
  const groups = new Map<string, { feedType: string; unit: string; stock: number; latest: FeedItem | null; used: number; firstUse: Date | null }>();

  for (const item of items) {
    const k = key(item.feedType, item.unit);
    const g = groups.get(k) ?? { feedType: item.feedType.trim(), unit: item.unit, stock: 0, latest: null, used: 0, firstUse: null };
    g.stock += Number(item.currentQuantity);
    if (!g.latest || new Date(item.purchaseDate) > new Date(g.latest.purchaseDate)) g.latest = item;
    groups.set(k, g);
  }

  for (const row of usage) {
    // The report gives a plain YYYY-MM-DD; read it as a local day.
    const date = new Date(`${String(row.Date).slice(0, 10)}T00:00:00`);
    if (date < from) continue;
    const g = groups.get(key(row.FeedType, row.Unit));
    if (!g) continue; // used up and deleted: nothing left to plan for
    g.used += Number(row.QuantityUsed);
    if (!g.firstUse || date < g.firstUse) g.firstUse = date;
  }

  return [...groups.values()]
    .map((g) => {
      // Average over the days since feed use was first recorded, so a new farm isn't under-counted.
      const days = g.firstUse ? Math.max(1, Math.min(USAGE_DAYS, daysBetween(g.firstUse, day0) + 1)) : USAGE_DAYS;
      const usedPerDay = g.used / days;
      const latest = g.latest;
      const unitPrice = latest && latest.quantity > 0 ? Number(latest.cost) / Number(latest.quantity) : null;
      if (usedPerDay <= 0) {
        return { feedType: g.feedType, unit: g.unit, stock: round1(g.stock), usedPerDay: 0, daysLeft: null, runsOutOn: null, orderBy: null, orderQuantity: 0, unitPrice, orderCost: null, status: 'noUse' as const };
      }
      const daysLeft = Math.floor(g.stock / usedPerDay);
      const orderQuantity = Math.ceil(usedPerDay * COVER_DAYS);
      const status: RunwayStatus =
        g.stock <= 0 ? 'out' : daysLeft <= LEAD_DAYS ? 'orderNow' : daysLeft <= LEAD_DAYS + 7 ? 'soon' : 'ok';
      return {
        feedType: g.feedType,
        unit: g.unit,
        stock: round1(g.stock),
        usedPerDay: round1(usedPerDay),
        daysLeft,
        runsOutOn: addDays(day0, daysLeft),
        orderBy: addDays(day0, Math.max(0, daysLeft - LEAD_DAYS)),
        orderQuantity,
        unitPrice: unitPrice === null ? null : Math.round(unitPrice * 100) / 100,
        orderCost: unitPrice === null ? null : Math.round(orderQuantity * unitPrice),
        status,
      };
    })
    .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
}
