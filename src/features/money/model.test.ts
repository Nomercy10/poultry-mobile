import {
  addMonths,
  ageBucket,
  amountDue,
  applyPayment,
  isLatePayer,
  overCreditLimit,
  beforeHistory,
  composeNotes,
  duesByCustomer,
  monthRange,
  parseNotes,
  type Sale,
  saleTotal,
  statusFor,
  totalByBucket,
} from './model';

const sale = (over: Partial<Sale>): Sale => ({
  id: 's1',
  farmId: 'f1',
  type: 'EGG_SALE',
  customerId: 'c1',
  quantity: 10,
  rate: 150,
  total: 1500,
  paymentStatus: 'UNPAID',
  invoiceNumber: null,
  date: '2026-11-20T00:00:00.000Z',
  notes: null,
  customer: { id: 'c1', name: 'Ramesh', phone: '9800000000', email: null, address: null, gstNumber: null },
  ...over,
});

describe('notes metadata', () => {
  it('round-trips paid amount, unit and free text', () => {
    const notes = composeNotes({ paid: 500, unit: 'TRAY', text: 'Collected at gate' });
    expect(notes).toBe('Paid so far: ₹500\nUnit: TRAY\nCollected at gate');
    expect(parseNotes(notes)).toEqual({ paid: 500, unit: 'TRAY', text: 'Collected at gate' });
  });

  it('leaves ordinary notes alone', () => {
    expect(parseNotes('Unit: lots of eggs')).toEqual({ text: 'Unit: lots of eggs' });
    expect(parseNotes(null)).toEqual({ text: '' });
    expect(composeNotes({ text: '  ' })).toBeUndefined();
  });

  it('reads amounts written with commas', () => {
    expect(parseNotes('Paid so far: ₹1,250.5').paid).toBe(1250.5);
  });
});

describe('dues', () => {
  it('works out what is still owed', () => {
    expect(amountDue(sale({ paymentStatus: 'PAID' }))).toBe(0);
    expect(amountDue(sale({ paymentStatus: 'UNPAID' }))).toBe(1500);
    expect(amountDue(sale({ paymentStatus: 'PARTIAL', notes: 'Paid so far: ₹600' }))).toBe(900);
    // Part-paid without a recorded amount (e.g. entered on the web) counts as fully due.
    expect(amountDue(sale({ paymentStatus: 'PARTIAL' }))).toBe(1500);
  });

  it('records payments and settles when the full amount is in', () => {
    const first = applyPayment(sale({ notes: 'Unit: TRAY' }), 500);
    expect(first).toEqual({ paymentStatus: 'PARTIAL', notes: 'Paid so far: ₹500\nUnit: TRAY' });
    const settled = applyPayment(sale({ paymentStatus: 'PARTIAL', notes: first.notes ?? null }), 1000);
    expect(settled).toEqual({ paymentStatus: 'PAID', notes: 'Unit: TRAY' });
  });

  it('picks the status for a new sale', () => {
    expect(statusFor(1000, 1000)).toBe('PAID');
    expect(statusFor(1000, 0)).toBe('UNPAID');
    expect(statusFor(1000, 400)).toBe('PARTIAL');
  });

  it('groups dues by customer, biggest first, with age buckets', () => {
    const today = new Date(2026, 10, 24);
    const groups = duesByCustomer(
      [
        sale({ id: 'a', total: 1000, date: new Date(2026, 10, 20).toISOString() }),
        sale({ id: 'b', total: 2000, date: new Date(2026, 8, 1).toISOString() }),
        sale({ id: 'c', customerId: null, customer: null, total: 5000, date: new Date(2026, 9, 10).toISOString() }),
        sale({ id: 'd', paymentStatus: 'PAID', total: 9999 }),
      ],
      today,
    );
    expect(groups.map((g) => [g.customerId, g.due, g.bucket])).toEqual([
      [null, 5000, 'late'],
      ['c1', 3000, 'veryLate'],
    ]);
    expect(totalByBucket(groups)).toEqual({ current: 1000, late: 5000, veryLate: 2000 });
  });

  it('buckets by age', () => {
    const today = new Date(2026, 10, 24);
    expect(ageBucket(new Date(2026, 10, 1), today)).toBe('current');
    expect(ageBucket(new Date(2026, 9, 1), today)).toBe('late');
    expect(ageBucket(new Date(2026, 6, 1), today)).toBe('veryLate');
  });
});

describe('months', () => {
  it('covers a whole local month', () => {
    const { dateFrom, dateTo } = monthRange(new Date(2026, 1, 14));
    expect(new Date(dateFrom)).toEqual(new Date(2026, 1, 1));
    expect(new Date(dateTo).getTime()).toBe(new Date(2026, 2, 1).getTime() - 1);
  });

  it('steps months across years', () => {
    expect(addMonths(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 1));
  });

  it('knows when a month is outside the plan history', () => {
    expect(beforeHistory(new Date(2025, 9, 1), '2025-11-24')).toBe(true);
    expect(beforeHistory(new Date(2025, 10, 1), '2025-11-24')).toBe(false);
    expect(beforeHistory(new Date(2000, 0, 1), null)).toBe(false);
  });
});

it('multiplies quantity by rate to paise', () => {
  expect(saleTotal(3, 0.1)).toBe(0.3);
  expect(saleTotal(undefined, 5)).toBe(0);
});

describe('isLatePayer', () => {
  const today = new Date(2026, 10, 25);
  const ago = (days: number) => new Date(2026, 10, 25 - days).toISOString();
  const unpaid = (days: number) => ({ id: String(days), date: ago(days), total: 100, paymentStatus: 'UNPAID' as const, notes: null });
  it('flags two sales over 30 days, or one over 60', () => {
    expect(isLatePayer({ sales: [unpaid(35), unpaid(40)] as never }, today)).toBe(true);
    expect(isLatePayer({ sales: [unpaid(61)] as never }, today)).toBe(true);
  });
  it('does not flag one sale a little late, or recent dues', () => {
    expect(isLatePayer({ sales: [unpaid(35), unpaid(5)] as never }, today)).toBe(false);
  });
});

describe('overCreditLimit', () => {
  it('reports how far over the limit a new unpaid sale goes', () => {
    expect(overCreditLimit(10000, 8000, 3000)).toBe(1000);
    expect(overCreditLimit(10000, 8000, 2000)).toBe(0);
    expect(overCreditLimit(null, 8000, 99999)).toBe(0);
    expect(overCreditLimit(0, 8000, 99999)).toBe(0);
  });
});
