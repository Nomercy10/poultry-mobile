// Tax pack: one Indian financial year (1 April to 31 March) of sales and
// expenses, summed up and exported as a CSV the farmer can send to their CA.
// It adds up the farm's own records; it doesn't work out any tax.

import { amountDue, amountPaid, type Expense, type ExpenseCategory, parseNotes, round2, type Sale, type SaleType } from './model';

/** The year a financial year starts in: Nov 2026 → 2026 (FY 2026–27), Feb 2026 → 2025. */
export function financialYearOf(date: Date = new Date()): number {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

export function financialYearRange(startYear: number): { dateFrom: string; dateTo: string } {
  const from = new Date(startYear, 3, 1);
  const to = new Date(new Date(startYear + 1, 3, 1).getTime() - 1);
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

/** "2025–26" */
export function financialYearLabel(startYear: number): string {
  return `${startYear}–${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export type TaxSummary = {
  salesByType: Partial<Record<SaleType, number>>;
  salesTotal: number;
  received: number;
  stillDue: number;
  expensesByCategory: Partial<Record<ExpenseCategory, number>>;
  expensesTotal: number;
  /** GST paid on purchases, as entered on expenses. */
  gstPaid: number;
  profit: number;
  saleCount: number;
  expenseCount: number;
};

export function taxSummary(sales: Sale[], expenses: Expense[]): TaxSummary {
  const salesByType: Partial<Record<SaleType, number>> = {};
  const expensesByCategory: Partial<Record<ExpenseCategory, number>> = {};
  let salesTotal = 0;
  let received = 0;
  let stillDue = 0;
  for (const s of sales) {
    salesByType[s.type] = round2((salesByType[s.type] ?? 0) + s.total);
    salesTotal += s.total;
    received += amountPaid(s);
    stillDue += amountDue(s);
  }
  let expensesTotal = 0;
  let gstPaid = 0;
  for (const e of expenses) {
    expensesByCategory[e.category] = round2((expensesByCategory[e.category] ?? 0) + e.amount);
    expensesTotal += e.amount;
    gstPaid += e.gstAmount ?? 0;
  }
  return {
    salesByType,
    salesTotal: round2(salesTotal),
    received: round2(received),
    stillDue: round2(stillDue),
    expensesByCategory,
    expensesTotal: round2(expensesTotal),
    gstPaid: round2(gstPaid),
    profit: round2(salesTotal - expensesTotal),
    saleCount: sales.length,
    expenseCount: expenses.length,
  };
}

/** One CSV cell: quoted when it holds a comma, quote or line break. */
export function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const row = (cells: (string | number | null | undefined)[]) => cells.map(csvCell).join(',');
const day = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export type CsvLabels = {
  saleType: (t: SaleType) => string;
  category: (c: ExpenseCategory) => string;
  paymentMode: (m: Expense['paymentMode']) => string;
  status: (s: Sale['paymentStatus']) => string;
};

/** Summary, then every sale, then every expense, in one CSV. Headings are in English for the CA. */
export function taxPackCsv(
  farmName: string,
  startYear: number,
  summary: TaxSummary,
  sales: Sale[],
  expenses: Expense[],
  labels: CsvLabels,
): string {
  const lines: string[] = [
    row([`Tax pack: ${farmName}`]),
    row([`Financial year ${financialYearLabel(startYear)} (1 April ${startYear} to 31 March ${startYear + 1})`]),
    row(['Totals of the farm records. Please check with your CA; this is not tax advice.']),
    '',
    row(['Summary', 'Amount (₹)']),
    row(['Total sales', summary.salesTotal]),
    ...Object.entries(summary.salesByType).map(([type, amount]) => row([`  ${labels.saleType(type as SaleType)}`, amount])),
    row(['Money received', summary.received]),
    row(['Still due from customers', summary.stillDue]),
    row(['Total expenses', summary.expensesTotal]),
    ...Object.entries(summary.expensesByCategory).map(([cat, amount]) => row([`  ${labels.category(cat as ExpenseCategory)}`, amount])),
    row(['GST paid on purchases', summary.gstPaid]),
    row([summary.profit >= 0 ? 'Profit' : 'Loss', Math.abs(summary.profit)]),
    '',
    row(['Sales']),
    row(['Date', 'Type', 'Customer', 'Quantity', 'Unit', 'Rate (₹)', 'Total (₹)', 'Received (₹)', 'Due (₹)', 'Status', 'Invoice no.']),
    ...[...sales]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) =>
        row([
          day(s.date),
          labels.saleType(s.type),
          s.customer?.name ?? '',
          s.quantity,
          parseNotes(s.notes).unit ?? '',
          s.rate,
          s.total,
          amountPaid(s),
          amountDue(s),
          labels.status(s.paymentStatus),
          s.invoiceNumber ?? '',
        ]),
      ),
    '',
    row(['Expenses']),
    row(['Date', 'Category', 'Vendor', 'Amount (₹)', 'GST (₹)', 'Paid by', 'Bill no.', 'Notes']),
    ...[...expenses]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) =>
        row([day(e.date), labels.category(e.category), e.vendor ?? '', e.amount, e.gstAmount ?? '', labels.paymentMode(e.paymentMode), e.invoiceNumber ?? '', e.notes ?? '']),
      ),
  ];
  return lines.join('\r\n');
}
