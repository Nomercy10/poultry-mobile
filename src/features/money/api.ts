import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { useAuth } from '@/store/auth';

import type { Expense, ExpenseCategory, Party, PaymentMode, PaymentStatus, Sale, SaleType } from './model';
import type { Renewal, RenewalKind } from './renewals';

export type Range = { dateFrom: string; dateTo: string };

export type SaleInput = {
  farmId: string;
  type: SaleType;
  customerId?: string;
  quantity: number;
  rate: number;
  paymentStatus: PaymentStatus;
  date: string;
  notes?: string;
};

export type ExpenseInput = {
  farmId: string;
  category: ExpenseCategory;
  amount: number;
  gstAmount?: number;
  vendor?: string;
  paymentMode: PaymentMode;
  invoiceNumber?: string;
  date: string;
  notes?: string;
};

export type PartyKind = 'customers' | 'suppliers';
export type PartyInput = {
  name: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  suppliesType?: string;
  /** Customers only; null clears it. */
  creditLimit?: number | null;
};

export type RenewalInput = {
  farmId: string;
  title: string;
  kind: RenewalKind;
  dueDate: string;
  repeatMonths: number | null;
  amount: number | null;
  remindDaysBefore: number;
  notes: string | null;
};

export const moneyKeys = {
  all: ['money'] as const,
  sales: (farmId: string | null, range: Range) => ['money', 'sales', farmId ?? 'all', range.dateFrom] as const,
  sale: (id: string) => ['money', 'sale', id] as const,
  lastSale: (type: SaleType, farmId: string | null) => ['money', 'lastSale', type, farmId ?? 'all'] as const,
  expenses: (farmId: string | null, range: Range) => ['money', 'expenses', farmId ?? 'all', range.dateFrom] as const,
  expense: (id: string) => ['money', 'expense', id] as const,
  dues: (farmId: string | null) => ['money', 'dues', farmId ?? 'all'] as const,
  parties: (kind: PartyKind) => ['money', kind] as const,
  renewals: (farmId: string | null) => ['money', 'renewals', farmId ?? 'all'] as const,
};

// The server returns Prisma Float/Decimal; normalise to numbers.
const toSale = (s: Sale): Sale => ({ ...s, quantity: Number(s.quantity), rate: Number(s.rate), total: Number(s.total) });
const toExpense = (e: Expense): Expense => ({
  ...e,
  amount: Number(e.amount),
  gstAmount: e.gstAmount === null || e.gstAmount === undefined ? null : Number(e.gstAmount),
});

const MAX_PAGE = 100;

/** Sales in a date range, newest first. */
export function useSales(farmId: string | null, range: Range) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.sales(farmId, range),
    queryFn: ({ signal }) =>
      api
        .page<Sale>('/revenue', { query: { farmId: farmId ?? undefined, ...range, limit: MAX_PAGE, sortOrder: 'desc' }, signal })
        .then((r) => ({ items: r.items.map(toSale), more: r.meta.total > r.items.length })),
    enabled: can(user, 'REVENUE'),
  });
}

/** Most pages a "since" query reads (100 rows each), so a huge history can't stall the phone. */
const MAX_PAGES = 30;

/** Every row of a list endpoint in a date range, reading page after page. */
async function fetchAll<T>(path: string, query: Record<string, string | undefined>, signal?: AbortSignal) {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await api.page<T>(path, { query: { ...query, page, limit: MAX_PAGE, sortOrder: 'desc' }, signal });
    items.push(...r.items);
    if (page >= r.meta.totalPages || r.items.length === 0) return { items, complete: true };
  }
  return { items, complete: false };
}

/** All sales in a range (for forecasts and the tax pack), not just the first page. */
export function useAllSales(farmId: string | null, range: Range) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: [...moneyKeys.all, 'allSales', farmId ?? 'all', range.dateFrom, range.dateTo],
    queryFn: ({ signal }) =>
      fetchAll<Sale>('/revenue', { farmId: farmId ?? undefined, ...range }, signal).then((r) => ({
        ...r,
        items: r.items.map(toSale),
      })),
    enabled: can(user, 'REVENUE'),
  });
}

/** All expenses in a range, not just the first page. */
export function useAllExpenses(farmId: string | null, range: Range) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: [...moneyKeys.all, 'allExpenses', farmId ?? 'all', range.dateFrom, range.dateTo],
    queryFn: ({ signal }) =>
      fetchAll<Expense>('/expenses', { farmId: farmId ?? undefined, ...range }, signal).then((r) => ({
        ...r,
        items: r.items.map(toExpense),
      })),
    enabled: can(user, 'EXPENSE'),
  });
}

export function useSale(id: string | undefined) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.sale(id ?? ''),
    queryFn: ({ signal }) => api.get<Sale>(`/revenue/${id}`, { signal }).then(toSale),
    enabled: !!id && can(user, 'REVENUE'),
  });
}

/** The latest sale of a kind, to suggest the same rate and unit next time. */
export function useLastSale(type: SaleType, farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.lastSale(type, farmId),
    queryFn: ({ signal }) =>
      api
        .page<Sale>('/revenue', { query: { farmId: farmId ?? undefined, type, limit: 1, sortOrder: 'desc' }, signal })
        .then((r) => (r.items[0] ? toSale(r.items[0]) : null)),
    enabled: can(user, 'REVENUE'),
  });
}

/** Every part-paid or unpaid sale (the server doesn't page this list). */
export function useDues(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.dues(farmId),
    queryFn: ({ signal }) =>
      api.get<Sale[]>('/revenue/outstanding', { query: { farmId: farmId ?? undefined }, signal }).then((list) => list.map(toSale)),
    enabled: can(user, 'REVENUE'),
  });
}

export function useExpenses(farmId: string | null, range: Range) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.expenses(farmId, range),
    queryFn: ({ signal }) =>
      api
        .page<Expense>('/expenses', { query: { farmId: farmId ?? undefined, ...range, limit: MAX_PAGE, sortOrder: 'desc' }, signal })
        .then((r) => ({ items: r.items.map(toExpense), more: r.meta.total > r.items.length })),
    enabled: can(user, 'EXPENSE'),
  });
}

export function useExpense(id: string | undefined) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.expense(id ?? ''),
    queryFn: ({ signal }) => api.get<Expense>(`/expenses/${id}`, { signal }).then(toExpense),
    enabled: !!id && can(user, 'EXPENSE'),
  });
}

export function useParties(kind: PartyKind) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.parties(kind),
    queryFn: ({ signal }) =>
      api.page<Party>(`/${kind}`, { query: { limit: MAX_PAGE, sortBy: 'name', sortOrder: 'asc' }, signal }).then((r) => r.items),
    enabled: can(user, kind === 'customers' ? 'CUSTOMER' : 'SUPPLIER'),
  });
}

function useInvalidateMoney() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: moneyKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useSaveSale(id?: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (input: SaleInput) => {
      if (!id) return api.post<Sale>('/revenue', input);
      const { farmId: _farmId, ...rest } = input;
      return api.put<Sale>(`/revenue/${id}`, rest);
    },
    onSuccess: invalidate,
  });
}

/** Partial update, e.g. recording a payment. */
export function useUpdateSale(id: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (input: Partial<Omit<SaleInput, 'farmId'>>) => api.put<Sale>(`/revenue/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteSale(id: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({ mutationFn: () => api.delete(`/revenue/${id}`), onSuccess: invalidate });
}

export function useSaveExpense(id?: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (input: ExpenseInput) => {
      if (!id) return api.post<Expense>('/expenses', input);
      const { farmId: _farmId, ...rest } = input;
      return api.put<Expense>(`/expenses/${id}`, rest);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteExpense(id: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({ mutationFn: () => api.delete(`/expenses/${id}`), onSuccess: invalidate });
}

export function useSaveParty(kind: PartyKind, id?: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (input: PartyInput) => (id ? api.put<Party>(`/${kind}/${id}`, input) : api.post<Party>(`/${kind}`, input)),
    onSuccess: invalidate,
  });
}

const toRenewal = (r: Renewal): Renewal => ({ ...r, amount: r.amount === null ? null : Number(r.amount) });

/** Open renewals, soonest first. A 404 means the server doesn't have renewals yet. */
export function useRenewals(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: moneyKeys.renewals(farmId),
    queryFn: ({ signal }) =>
      api.get<Renewal[]>('/renewals', { query: { farmId: farmId ?? undefined }, signal }).then((list) => list.map(toRenewal)),
    enabled: can(user, 'RENEWAL'),
    retry: (count, error) => !(isApiError(error) && error.status === 404) && count < 2,
  });
}

export function useSaveRenewal(id?: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (input: RenewalInput) => {
      if (!id) return api.post<Renewal>('/renewals', input);
      const { farmId: _farmId, ...rest } = input;
      return api.put<Renewal>(`/renewals/${id}`, rest);
    },
    onSuccess: invalidate,
  });
}

/** Repeating: moves to the next due date. One-off: marks it done. */
export function useRenewalDone() {
  const invalidate = useInvalidateMoney();
  return useMutation({ mutationFn: (id: string) => api.post<Renewal>(`/renewals/${id}/done`), onSuccess: invalidate });
}

export function useDeleteRenewal() {
  const invalidate = useInvalidateMoney();
  return useMutation({ mutationFn: (id: string) => api.delete(`/renewals/${id}`), onSuccess: invalidate });
}
