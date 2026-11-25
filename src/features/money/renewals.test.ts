import { addDays, localDayIso } from '@/lib/dates';

import { daysUntil, groupRenewals, remindFrom, renewalState } from './renewals';

const today = new Date(2026, 10, 25, 15, 30);
const due = (n: number, remindDaysBefore = 7, doneAt: string | null = null) => ({ dueDate: localDayIso(addDays(today, n)), remindDaysBefore, doneAt });

describe('renewals', () => {
  it('counts days to the due date in whole local days', () => {
    expect(daysUntil(due(0).dueDate, today)).toBe(0);
    expect(daysUntil(due(5).dueDate, today)).toBe(5);
    expect(daysUntil(due(-2).dueDate, today)).toBe(-2);
  });

  it('is due soon inside the reminder window, overdue after the date', () => {
    expect(renewalState(due(7), today)).toBe('dueSoon');
    expect(renewalState(due(8), today)).toBe('later');
    expect(renewalState(due(20, 30), today)).toBe('dueSoon');
    expect(renewalState(due(-1), today)).toBe('overdue');
  });

  it('groups open renewals soonest first and skips done ones', () => {
    const g = groupRenewals([due(40), due(3), due(-5), due(1), due(2, 7, 'x')], today);
    expect(g.overdue).toHaveLength(1);
    expect(g.dueSoon.map((r) => daysUntil(r.dueDate, today))).toEqual([1, 3]);
    expect(g.later).toHaveLength(1);
  });

  it('starts the reminder remindDaysBefore the due date', () => {
    expect(remindFrom(due(10, 7)).getTime()).toBe(addDays(new Date(2026, 10, 25), 3).getTime());
  });
});
