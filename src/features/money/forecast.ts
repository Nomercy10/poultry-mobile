// Cash forecast: where the farm's cash is heading over the next 30, 60 and 90
// days, from what actually came in and went out recently. Plain arithmetic on
// the farm's own records, so the app can always show how a number was reached.

import { addDays, daysBetween, startOfLocalDay } from '@/lib/dates';

import { ageBucket, amountDue, amountPaid, type Expense, round2, type Sale } from './model';

export const FORECAST_WINDOWS = [30, 60, 90] as const;
export type ForecastWindow = (typeof FORECAST_WINDOWS)[number];

/** Days of past records the averages are taken over. */
export const BASIS_DAYS = 60;
/** Fewer days of records than this and the forecast is only a rough guess. */
export const MIN_BASIS_DAYS = 14;
/** Dues up to 60 days old are expected back within the next 30 days; older ones are not counted. */
const DUES_COLLECT_DAYS = 30;

export type WindowForecast = {
  days: ForecastWindow;
  moneyIn: number;
  moneyOut: number;
  /** Cash in hand at the end of the window. */
  endCash: number;
};

export type Forecast = {
  /** Days of records the averages cover (up to BASIS_DAYS). */
  basisDays: number;
  enoughData: boolean;
  inPerDay: number;
  outPerDay: number;
  /** Dues up to 60 days old, counted as coming in over the next 30 days. */
  expectedDues: number;
  /** Dues over 60 days old: not counted, shown as at risk. */
  riskyDues: number;
  windows: WindowForecast[];
  /** First day cash goes below zero within 90 days, or null. */
  shortOn: Date | null;
  /** How far below zero cash goes at its lowest (0 if it never does). */
  shortBy: number;
};

export type ForecastInput = {
  /** Sales dated in the last BASIS_DAYS days (older ones are ignored). */
  sales: Pick<Sale, 'date' | 'total' | 'paymentStatus' | 'notes'>[];
  expenses: Pick<Expense, 'date' | 'amount'>[];
  /** Every sale with money still due. */
  dues: Pick<Sale, 'date' | 'total' | 'paymentStatus' | 'notes'>[];
  cashToday: number;
  today?: Date;
};

export function cashForecast({ sales, expenses, dues, cashToday, today = new Date() }: ForecastInput): Forecast {
  const day0 = startOfLocalDay(today);
  const from = addDays(day0, -BASIS_DAYS);
  const inWindow = (date: string) => {
    const d = new Date(date);
    return d >= from && d <= addDays(day0, 1);
  };

  const recentSales = sales.filter((s) => inWindow(s.date));
  const recentExpenses = expenses.filter((e) => inWindow(e.date));

  // Average over the days the farm has actually been recording, not a fixed 60,
  // so a farm that started 20 days ago isn't shown a third of its real costs.
  const dates = [...recentSales.map((s) => s.date), ...recentExpenses.map((e) => e.date)];
  const earliest = dates.length ? new Date(Math.min(...dates.map((d) => new Date(d).getTime()))) : day0;
  const basisDays = Math.max(1, Math.min(BASIS_DAYS, daysBetween(earliest, day0) + 1));

  const received = recentSales.reduce((sum, s) => sum + amountPaid(s), 0);
  const spent = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const inPerDay = received / basisDays;
  const outPerDay = spent / basisDays;

  let expectedDues = 0;
  let riskyDues = 0;
  for (const s of dues) {
    const due = amountDue(s);
    if (due <= 0) continue;
    if (ageBucket(s.date, day0) === 'veryLate') riskyDues += due;
    else expectedDues += due;
  }

  const cashOnDay = (n: number) =>
    cashToday + n * (inPerDay - outPerDay) + (expectedDues * Math.min(n, DUES_COLLECT_DAYS)) / DUES_COLLECT_DAYS;

  let shortOn: Date | null = null;
  let lowest = cashToday;
  for (let n = 1; n <= FORECAST_WINDOWS[FORECAST_WINDOWS.length - 1]; n++) {
    const cash = cashOnDay(n);
    if (cash < 0 && !shortOn) shortOn = addDays(day0, n);
    lowest = Math.min(lowest, cash);
  }

  const windows = FORECAST_WINDOWS.map((days) => ({
    days,
    moneyIn: round2(days * inPerDay + (expectedDues * Math.min(days, DUES_COLLECT_DAYS)) / DUES_COLLECT_DAYS),
    moneyOut: round2(days * outPerDay),
    endCash: round2(cashOnDay(days)),
  }));

  return {
    basisDays,
    enoughData: basisDays >= MIN_BASIS_DAYS && dates.length > 0,
    inPerDay: round2(inPerDay),
    outPerDay: round2(outPerDay),
    expectedDues: round2(expectedDues),
    riskyDues: round2(riskyDues),
    windows,
    shortOn,
    shortBy: round2(Math.max(0, -lowest)),
  };
}
