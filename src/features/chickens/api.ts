import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { can } from '@/features/auth/permissions';
import { api } from '@/lib/api/client';
import { useAuth } from '@/store/auth';

export type BatchStatus = 'HEALTHY' | 'SICK' | 'DEAD' | 'SOLD' | 'TRANSFERRED';
export const BATCH_STATUSES: BatchStatus[] = ['HEALTHY', 'SICK', 'DEAD', 'SOLD', 'TRANSFERRED'];
/** Batches that still have birds on the farm (count against the plan's limit). */
export const ACTIVE_STATUSES: BatchStatus[] = ['HEALTHY', 'SICK'];

export type EventType = 'VACCINATION' | 'MEDICINE' | 'MORTALITY' | 'WEIGHT_CHECK' | 'STATUS_CHANGE' | 'NOTE';

/** ChickenBatch (chickens module in the web repo). */
export type Batch = {
  id: string;
  farmId: string;
  batchNumber: string;
  breed: string;
  purchaseDate: string;
  initialCount: number;
  currentCount: number;
  ageInDaysAtEntry: number;
  status: BatchStatus;
  mortalityCount: number;
  averageWeightKg: number | null;
  notes: string | null;
  currentAgeInDays?: number;
  farm?: { id: string; name: string };
  supplier?: { id: string; name: string } | null;
};

export type ChickenEvent = {
  id: string;
  type: EventType;
  eventDate: string;
  description: string | null;
  quantity: number | null;
  medicineName: string | null;
  weightKg: number | null;
};

export type Vaccination = {
  id: string;
  batchId: string;
  vaccineName: string;
  scheduledDate: string;
  administeredDate: string | null;
  status: 'SCHEDULED' | 'ADMINISTERED' | 'MISSED';
  notes: string | null;
  batch?: Batch;
};

export type BatchDetail = Batch & { events: ChickenEvent[]; vaccinations: Vaccination[] };

export type NewBatchInput = {
  farmId: string;
  batchNumber: string;
  breed: string;
  purchaseDate: string;
  initialCount: number;
  ageInDaysAtEntry: number;
  notes?: string;
};

export type NewEventInput = {
  type: EventType;
  eventDate: string;
  description?: string;
  quantity?: number;
  medicineName?: string;
  weightKg?: number;
  newStatus?: BatchStatus;
};

export const chickenKeys = {
  all: ['chickens'] as const,
  list: (farmId: string | null) => ['chickens', 'list', farmId ?? 'all'] as const,
  detail: (id: string) => ['chickens', 'detail', id] as const,
  upcoming: (days: number) => ['chickens', 'upcoming', days] as const,
};

export function isActive(b: Pick<Batch, 'status'>) {
  return ACTIVE_STATUSES.includes(b.status);
}

/** Age today in days (server sends it on lists and detail; fall back to computing it). */
export function ageInDays(b: Batch, today: Date = new Date()) {
  if (typeof b.currentAgeInDays === 'number') return b.currentAgeInDays;
  const days = Math.floor((today.getTime() - new Date(b.purchaseDate).getTime()) / 86_400_000);
  return b.ageInDaysAtEntry + Math.max(0, days);
}

export function useBatches(farmId: string | null) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: chickenKeys.list(farmId),
    queryFn: ({ signal }) =>
      api.page<Batch>('/chickens', { query: { farmId: farmId ?? undefined, limit: 100 }, signal }).then((r) => r.items),
    enabled: can(user, 'CHICKEN'),
  });
}

export function useBatch(id: string) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: chickenKeys.detail(id),
    queryFn: ({ signal }) => api.get<BatchDetail>(`/chickens/${id}`, { signal }),
    enabled: !!id && can(user, 'CHICKEN'),
  });
}

/** Scheduled vaccinations due within `daysAhead` days, overdue ones included (all farms). */
export function useUpcomingVaccinations(daysAhead = 0) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: chickenKeys.upcoming(daysAhead),
    queryFn: ({ signal }) =>
      api.get<Vaccination[]>('/chickens/vaccinations/upcoming', { query: { daysAhead }, signal }),
    enabled: can(user, 'CHICKEN'),
  });
}

function useInvalidateChickens() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: chickenKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useCreateBatch() {
  const invalidate = useInvalidateChickens();
  return useMutation({
    mutationFn: (input: NewBatchInput) => api.post<Batch>('/chickens', input),
    onSuccess: invalidate,
  });
}

export function useAddEvent(batchId: string) {
  const invalidate = useInvalidateChickens();
  return useMutation({
    mutationFn: (input: NewEventInput) => api.post<ChickenEvent>(`/chickens/${batchId}/events`, input),
    onSuccess: invalidate,
  });
}

export function useAddVaccination(batchId: string) {
  const invalidate = useInvalidateChickens();
  return useMutation({
    mutationFn: (input: { vaccineName: string; scheduledDate: string; notes?: string }) =>
      api.post<Vaccination>(`/chickens/${batchId}/vaccinations`, input),
    onSuccess: invalidate,
  });
}

export function useMarkVaccination(batchId: string) {
  const invalidate = useInvalidateChickens();
  return useMutation({
    mutationFn: ({ vaccinationId, status }: { vaccinationId: string; status: 'ADMINISTERED' | 'MISSED' }) =>
      api.put<Vaccination>(`/chickens/${batchId}/vaccinations/${vaccinationId}`, {
        status,
        administeredDate: status === 'ADMINISTERED' ? new Date().toISOString() : undefined,
      }),
    onSuccess: invalidate,
  });
}
