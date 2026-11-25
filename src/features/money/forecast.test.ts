import { addDays, localDayIso } from '@/lib/dates';

import { cashForecast } from './forecast';

const today = new Date(2026, 10, 25);
const day = (n: number) => localDayIso(addDays(today, n));
const sale = (n: number, total: number, paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL' = 'PAID', notes: string | null = null) => ({
  date: day(n),
  total,
  paymentStatus,
  notes,
});

describe('cashForecast', () => {
  it('projects steady income and costs forward', () => {
    // 60 days of ₹1,000 in and ₹600 out a day.
    const sales = Array.from({ length: 60 }, (_, i) => sale(-i, 1000));
    const expenses = Array.from({ length: 60 }, (_, i) => ({ date: day(-i), amount: 600 }));
    const f = cashForecast({ sales, expenses, dues: [], cashToday: 5000, today });
    expect(f.basisDays).toBe(60);
    expect(f.enoughData).toBe(true);
    expect([f.inPerDay, f.outPerDay]).toEqual([1000, 600]);
    expect(f.windows.map((w) => w.endCash)).toEqual([17000, 29000, 41000]);
    expect(f.shortOn).toBeNull();
    expect(f.shortBy).toBe(0);
  });

  it('warns when costs run ahead of income', () => {
    const sales = Array.from({ length: 30 }, (_, i) => sale(-i, 500));
    const expenses = Array.from({ length: 30 }, (_, i) => ({ date: day(-i), amount: 800 }));
    const f = cashForecast({ sales, expenses, dues: [], cashToday: 3000, today });
    // Down ₹300 a day from ₹3,000: below zero on day 11.
    expect(f.shortOn?.getTime()).toBe(addDays(today, 11).getTime());
    expect(f.shortBy).toBe(24000);
  });

  it('averages over the days actually recorded, not a fixed 60', () => {
    const sales = Array.from({ length: 20 }, (_, i) => sale(-i, 1000));
    const f = cashForecast({ sales, expenses: [], dues: [], cashToday: 0, today });
    expect(f.basisDays).toBe(20);
    expect(f.inPerDay).toBe(1000);
  });

  it('counts only money received, and recent dues as coming in', () => {
    const sales = [sale(-1, 1000, 'UNPAID'), sale(-2, 1000, 'PARTIAL', 'Paid so far: ₹400')];
    const dues = [sale(-10, 2000, 'UNPAID'), sale(-90, 5000, 'UNPAID')];
    const f = cashForecast({ sales, expenses: [], dues, cashToday: 0, today });
    expect(f.inPerDay).toBeCloseTo(400 / f.basisDays, 2);
    expect(f.expectedDues).toBe(2000);
    expect(f.riskyDues).toBe(5000);
    expect(f.enoughData).toBe(false);
  });
});
