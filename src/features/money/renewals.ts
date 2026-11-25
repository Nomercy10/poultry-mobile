// Renewals calendar: licences, pollution-board consent, insurance, loan EMIs
// and vehicle papers, with a reminder before each is due. Stored by the
// backend's /renewals endpoints (web repo, renewals-credit-limits).

import { addDays, daysBetween, startOfLocalDay } from '@/lib/dates';

export type RenewalKind = 'LICENCE' | 'POLLUTION_CONSENT' | 'INSURANCE' | 'LOAN_EMI' | 'VEHICLE' | 'OTHER';
export const RENEWAL_KINDS: RenewalKind[] = ['LICENCE', 'POLLUTION_CONSENT', 'INSURANCE', 'LOAN_EMI', 'VEHICLE', 'OTHER'];

/** Repeat choices offered in the form, in months; null = once. */
export const REPEAT_CHOICES = [null, 1, 3, 6, 12] as const;
export const REMIND_CHOICES = [3, 7, 15, 30] as const;

/** How many open renewals the Free plan keeps. */
export const FREE_RENEWALS = 3;

export type Renewal = {
  id: string;
  farmId: string;
  title: string;
  kind: RenewalKind;
  dueDate: string;
  repeatMonths: number | null;
  amount: number | null;
  remindDaysBefore: number;
  notes: string | null;
  doneAt: string | null;
  farm?: { id: string; name: string };
};

export type RenewalState = 'overdue' | 'dueSoon' | 'later';

export function renewalState(r: Pick<Renewal, 'dueDate' | 'remindDaysBefore'>, today: Date = new Date()): RenewalState {
  const days = daysUntil(r.dueDate, today);
  if (days < 0) return 'overdue';
  if (days <= r.remindDaysBefore) return 'dueSoon';
  return 'later';
}

/** Days from today to the due date: 0 = today, negative = overdue. */
export function daysUntil(dueDate: string, today: Date = new Date()): number {
  return daysBetween(startOfLocalDay(today), new Date(dueDate));
}

/** The date the reminder starts showing. */
export function remindFrom(r: Pick<Renewal, 'dueDate' | 'remindDaysBefore'>): Date {
  return addDays(startOfLocalDay(new Date(r.dueDate)), -r.remindDaysBefore);
}

/** Open renewals grouped for the list, each group soonest first. */
export function groupRenewals<T extends Pick<Renewal, 'dueDate' | 'remindDaysBefore' | 'doneAt'>>(
  list: T[],
  today: Date = new Date(),
): Record<RenewalState, T[]> {
  const groups: Record<RenewalState, T[]> = { overdue: [], dueSoon: [], later: [] };
  for (const r of [...list].filter((x) => !x.doneAt).sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
    groups[renewalState(r, today)].push(r);
  }
  return groups;
}
