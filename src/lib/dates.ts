// Farm records are per calendar day. The backend stores exact timestamps and the
// web seed uses local midnight, so the phone sends local midnight too: that
// keeps "one egg entry per farm per day" working across web and phone.

export function startOfLocalDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Local midnight of that day, as an ISO timestamp for the API. */
export function localDayIso(date: Date = new Date()): string {
  return startOfLocalDay(date).toISOString();
}

/** dateFrom / dateTo covering one local day. */
export function dayRange(date: Date): { dateFrom: string; dateTo: string } {
  const start = startOfLocalDay(date);
  const end = new Date(addDays(start, 1).getTime() - 1);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

/** Whole days from `from` to `to` (local calendar days). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / 86_400_000);
}

const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** "23 Nov", or "23 Nov 2025" outside the current year. */
export function formatDay(value: string | Date, today: Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.getFullYear() === today.getFullYear() ? dayMonth.format(date) : dayMonthYear.format(date);
}

export type RelativeDay = 'today' | 'yesterday' | 'tomorrow' | null;

export function relativeDay(value: string | Date, today: Date = new Date()): RelativeDay {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diff = daysBetween(today, date);
  if (diff === 0) return 'today';
  if (diff === -1) return 'yesterday';
  if (diff === 1) return 'tomorrow';
  return null;
}
