import type { Expense, Sale } from './model';
import { csvCell, financialYearLabel, financialYearOf, financialYearRange, taxPackCsv, taxSummary } from './tax-pack';

const sale = (over: Partial<Sale>): Sale => ({
  id: 's',
  farmId: 'f',
  type: 'EGG_SALE',
  customerId: null,
  quantity: 10,
  rate: 150,
  total: 1500,
  paymentStatus: 'PAID',
  invoiceNumber: null,
  date: new Date(2026, 4, 10).toISOString(),
  notes: null,
  ...over,
});
const expense = (over: Partial<Expense>): Expense => ({
  id: 'e',
  farmId: 'f',
  category: 'FEED',
  amount: 1000,
  gstAmount: 50,
  vendor: 'Shree Feeds, Pune',
  paymentMode: 'UPI',
  invoiceNumber: null,
  notes: null,
  date: new Date(2026, 4, 12).toISOString(),
  ...over,
});

describe('financial year', () => {
  it('starts on 1 April', () => {
    expect(financialYearOf(new Date(2026, 10, 25))).toBe(2026);
    expect(financialYearOf(new Date(2026, 2, 31))).toBe(2025);
    expect(financialYearLabel(2025)).toBe('2025–26');
    const r = financialYearRange(2025);
    expect(new Date(r.dateFrom).getTime()).toBe(new Date(2025, 3, 1).getTime());
    expect(new Date(r.dateTo).getDate()).toBe(31);
  });
});

describe('taxSummary', () => {
  it('adds up sales, money received, expenses and GST paid', () => {
    const s = taxSummary(
      [sale({}), sale({ id: 's2', type: 'MANURE_SALE', total: 500, paymentStatus: 'PARTIAL', notes: 'Paid so far: ₹200' })],
      [expense({}), expense({ id: 'e2', category: 'LABOUR', amount: 400, gstAmount: null })],
    );
    expect(s.salesTotal).toBe(2000);
    expect(s.received).toBe(1700);
    expect(s.stillDue).toBe(300);
    expect(s.salesByType).toEqual({ EGG_SALE: 1500, MANURE_SALE: 500 });
    expect(s.expensesTotal).toBe(1400);
    expect(s.gstPaid).toBe(50);
    expect(s.profit).toBe(600);
  });
});

describe('taxPackCsv', () => {
  it('quotes cells with commas and lists every row', () => {
    expect(csvCell('Shree Feeds, Pune')).toBe('"Shree Feeds, Pune"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    const sales = [sale({})];
    const expenses = [expense({})];
    const csv = taxPackCsv('Green Farm', 2026, taxSummary(sales, expenses), sales, expenses, {
      saleType: (t) => t,
      category: (c) => c,
      paymentMode: (m) => m,
      status: (s) => s,
    });
    expect(csv).toContain('Financial year 2026–27');
    expect(csv).toContain('2026-05-12,FEED,"Shree Feeds, Pune",1000,50,UPI,,');
    expect(csv).toContain('Profit,500');
  });
});
