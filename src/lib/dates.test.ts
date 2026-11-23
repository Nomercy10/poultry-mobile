import { addDays, dayRange, daysBetween, formatDay, localDayIso, relativeDay, startOfLocalDay } from './dates';

describe('dates', () => {
  const today = new Date(2026, 10, 23, 15, 30);

  it('sends local midnight for a day', () => {
    expect(new Date(localDayIso(today)).getTime()).toBe(new Date(2026, 10, 23).getTime());
  });

  it('covers a whole local day', () => {
    const { dateFrom, dateTo } = dayRange(today);
    expect(new Date(dateFrom).getTime()).toBe(startOfLocalDay(today).getTime());
    expect(new Date(dateTo).getTime()).toBe(new Date(2026, 10, 24).getTime() - 1);
  });

  it('counts calendar days', () => {
    expect(daysBetween(new Date(2026, 10, 20, 23), today)).toBe(3);
    expect(daysBetween(today, addDays(today, -1))).toBe(-1);
  });

  it('labels nearby days', () => {
    expect(relativeDay(today, today)).toBe('today');
    expect(relativeDay(addDays(today, -1), today)).toBe('yesterday');
    expect(relativeDay(addDays(today, 1), today)).toBe('tomorrow');
    expect(relativeDay(addDays(today, -5), today)).toBeNull();
  });

  it('formats days the Indian way', () => {
    expect(formatDay(new Date(2026, 10, 3), today)).toBe('3 Nov');
    expect(formatDay(new Date(2025, 0, 9), today)).toBe('9 Jan 2025');
  });
});
