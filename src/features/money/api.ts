import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { useAuth } from '@/store/auth';

import type { Expense, ExpenseCategory, Party, PaymentMode, PaymentStatus, Sale, SaleType } from './model';

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
export type PartyInput = { name: string; phone?: string; address?: string; gstNumber?: string; suppliesType?: string };

export const moneyKeys = {
  all: ['money'] as const,
  sales: (farmId: string | null, range: Range) => ['money', 'sales', farmId ?? 'all', range.dateFrom] as const,
  sale: (id: string) => ['money', 'sale', id] as const,
  lastSale: (type: SaleType, farmId: string | null) => ['money', 'lastSale', type, farmId ?? 'all'] as const,
  expenses: (farmId: string | null, range: Range) => ['money', 'expenses', farmId ?? 'all', range.dateFrom] as const,
  expense: (id: string) => ['money', 'expense', id] as const,
  dues: (farmId: string | null) => ['money', 'dues', farmId ?? 'all'] as const,
  parties: (kind: PartyKind) => ['money', kind] as const,
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
