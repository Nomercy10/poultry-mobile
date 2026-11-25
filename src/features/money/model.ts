// Money records (Revenue, Expense, Customer, Supplier in the web repo) and the
// pure rules on top of them. Kept free of React so they can be unit-tested.

import { daysBetween, startOfLocalDay } from '@/lib/dates';

export type SaleType = 'EGG_SALE' | 'CHICKEN_SALE' | 'MANURE_SALE' | 'OTHER';
export const SALE_TYPES: SaleType[] = ['EGG_SALE', 'CHICKEN_SALE', 'MANURE_SALE', 'OTHER'];

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export const PAYMENT_STATUSES: PaymentStatus[] = ['PAID', 'PARTIAL', 'UNPAID'];

export type ExpenseCategory =
  | 'FEED'
  | 'ELECTRICITY'
  | 'WATER'
  | 'MEDICINE'
  | 'VACCINATION'
  | 'LABOUR'
  | 'TRANSPORTATION'
  | 'MAINTENANCE'
  | 'EQUIPMENT'
  | 'FARM_RENT'
  | 'PACKAGING'
  | 'MISCELLANEOUS';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'FEED',
  'LABOUR',
  'MEDICINE',
  'VACCINATION',
  'ELECTRICITY',
  'WATER',
  'TRANSPORTATION',
  'MAINTENANCE',
  'EQUIPMENT',
  'FARM_RENT',
  'PACKAGING',
  'MISCELLANEOUS',
];

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'CREDIT';
export const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT', 'CHEQUE', 'CARD'];

/** Selling unit. The backend has no unit column yet, so it travels in the notes (see composeNotes). */
export type SaleUnit = 'TRAY' | 'EGG' | 'KG' | 'BIRD' | 'BAG' | 'TROLLEY';
export const SALE_UNITS: Record<SaleType, SaleUnit[]> = {
  EGG_SALE: ['TRAY', 'EGG'],
  CHICKEN_SALE: ['KG', 'BIRD'],
  MANURE_SALE: ['BAG', 'TROLLEY'],
  OTHER: [],
};
export const EGGS_PER_TRAY = 30;

export type Party = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  suppliesType?: string | null;
};

export type Sale = {
  id: string;
  farmId: string;
  type: SaleType;
  customerId: string | null;
  quantity: number;
  rate: number;
  total: number;
  paymentStatus: PaymentStatus;
  invoiceNumber: string | null;
  date: string;
  notes: string | null;
  customer?: Party | null;
  farm?: { id: string; name: string };
};

export type Expense = {
  id: string;
  farmId: string;
  category: ExpenseCategory;
  amount: number;
  gstAmount: number | null;
  vendor: string | null;
  paymentMode: PaymentMode;
  invoiceNumber: string | null;
  notes: string | null;
  date: string;
  farm?: { id: string; name: string };
};

// ── Notes metadata ───────────────────────────────────────────────────────────
// Until the backend gets `amountPaid` and `unit` columns (see the tenant design
// doc), they are kept as plain first lines of the notes, readable on the web too:
//   Paid so far: ₹500
//   Unit: TRAY

export type NoteMeta = { paid?: number; unit?: SaleUnit; text: string };

const PAID_LINE = /^Paid so far: ₹?([\d,]+(?:\.\d+)?)\s*$/;
const UNIT_LINE = /^Unit: ([A-Z]+)\s*$/;
const UNITS = new Set<string>(Object.values(SALE_UNITS).flat());

export function parseNotes(notes: string | null | undefined): NoteMeta {
  const meta: NoteMeta = { text: '' };
  const rest: string[] = [];
  for (const line of (notes ?? '').split('\n')) {
    const paid = line.match(PAID_LINE);
    const unit = line.match(UNIT_LINE);
    if (paid && meta.paid === undefined) meta.paid = Number(paid[1].replace(/,/g, ''));
    else if (unit && UNITS.has(unit[1]) && meta.unit === undefined) meta.unit = unit[1] as SaleUnit;
    else rest.push(line);
  }
  meta.text = rest.join('\n').trim();
  return meta;
}

export function composeNotes(meta: NoteMeta): string | undefined {
  const lines: string[] = [];
  if (meta.paid !== undefined && meta.paid > 0) lines.push(`Paid so far: ₹${round2(meta.paid)}`);
  if (meta.unit) lines.push(`Unit: ${meta.unit}`);
  if (meta.text.trim()) lines.push(meta.text.trim());
  return lines.length ? lines.join('\n') : undefined;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Dues ─────────────────────────────────────────────────────────────────────

/** What the customer still owes on a sale. */
export function amountDue(sale: Pick<Sale, 'total' | 'paymentStatus' | 'notes'>): number {
  if (sale.paymentStatus === 'PAID') return 0;
  if (sale.paymentStatus === 'UNPAID') return sale.total;
  return Math.max(0, round2(sale.total - (parseNotes(sale.notes).paid ?? 0)));
}

export function amountPaid(sale: Pick<Sale, 'total' | 'paymentStatus' | 'notes'>): number {
  return round2(sale.total - amountDue(sale));
}

/** Status and notes after the customer pays `amount` more. */
export function applyPayment(
  sale: Pick<Sale, 'total' | 'paymentStatus' | 'notes'>,
  amount: number,
): { paymentStatus: PaymentStatus; notes: string | undefined } {
  const meta = parseNotes(sale.notes);
  const paid = round2(amountPaid(sale) + amount);
  if (paid >= sale.total) return { paymentStatus: 'PAID', notes: composeNotes({ ...meta, paid: undefined }) };
  if (paid <= 0) return { paymentStatus: 'UNPAID', notes: composeNotes({ ...meta, paid: undefined }) };
  return { paymentStatus: 'PARTIAL', notes: composeNotes({ ...meta, paid }) };
}

/** Status for a new sale from what was paid on the spot. */
export function statusFor(total: number, paidNow: number): PaymentStatus {
  if (paidNow >= total) return 'PAID';
  if (paidNow <= 0) return 'UNPAID';
  return 'PARTIAL';
}

export type AgeBucket = 'current' | 'late' | 'veryLate';

/** 0–30 days, 31–60 days, over 60 days since the sale. */
export function ageBucket(date: string | Date, today: Date = new Date()): AgeBucket {
  const days = daysBetween(new Date(date), today);
  if (days <= 30) return 'current';
  if (days <= 60) return 'late';
  return 'veryLate';
}

export type CustomerDues = {
  customerId: string | null;
  name: string | null;
  phone: string | null;
  due: number;
  oldest: string;
  bucket: AgeBucket;
  sales: Sale[];
};

/** Unpaid sales grouped by customer, biggest amount first. Sales with no customer group together. */
export function duesByCustomer(sales: Sale[], today: Date = new Date()): CustomerDues[] {
  const groups = new Map<string, CustomerDues>();
  for (const sale of sales) {
    const due = amountDue(sale);
    if (due <= 0) continue;
    const key = sale.customerId ?? '';
    const group = groups.get(key) ?? {
      customerId: sale.customerId,
      name: sale.customer?.name ?? null,
      phone: sale.customer?.phone ?? null,
      due: 0,
      oldest: sale.date,
      bucket: 'current' as AgeBucket,
      sales: [],
    };
    group.due = round2(group.due + due);
    if (new Date(sale.date) < new Date(group.oldest)) group.oldest = sale.date;
    group.sales.push(sale);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, bucket: ageBucket(g.oldest, today) }))
    .sort((a, b) => b.due - a.due);
}

/** Overdue = unpaid for more than 30 days. */
export const LATE_AFTER_DAYS = 30;

/**
 * A customer who keeps paying late: two or more sales unpaid for over 30 days,
 * or any sale unpaid for over 60. The backend doesn't record when a payment was
 * made, so this looks only at what is still unpaid.
 */
export function isLatePayer(group: Pick<CustomerDues, 'sales'>, today: Date = new Date()): boolean {
  const overdue = group.sales.filter((s) => amountDue(s) > 0 && daysAgo(s.date, today) > LATE_AFTER_DAYS);
  return overdue.length >= 2 || overdue.some((s) => ageBucket(s.date, today) === 'veryLate');
}

export function totalByBucket(groups: CustomerDues[]): Record<AgeBucket, number> {
  const out: Record<AgeBucket, number> = { current: 0, late: 0, veryLate: 0 };
  for (const g of groups) {
    for (const s of g.sales) out[ageBucket(s.date)] = round2(out[ageBucket(s.date)] + amountDue(s));
  }
  return out;
}

// ── Months ───────────────────────────────────────────────────────────────────

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(month: Date, n: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + n, 1);
}

/** dateFrom / dateTo covering one local calendar month. */
export function monthRange(month: Date): { dateFrom: string; dateTo: string } {
  const start = startOfMonth(month);
  const end = new Date(addMonths(start, 1).getTime() - 1);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** True when `month` starts before the plan's history limit (YYYY-MM-DD or null). */
export function beforeHistory(month: Date, historyFrom: string | null): boolean {
  if (!historyFrom) return false;
  const [y, m] = historyFrom.split('-').map(Number);
  return month < new Date(y, m - 1, 1);
}

// ── Sale maths ───────────────────────────────────────────────────────────────

export function saleTotal(quantity: number | undefined, rate: number | undefined): number {
  return round2((quantity ?? 0) * (rate ?? 0));
}

/** Days since a date, for "3 days ago". */
export function daysAgo(date: string, today: Date = new Date()): number {
  return Math.max(0, daysBetween(new Date(date), startOfLocalDay(today)));
}

