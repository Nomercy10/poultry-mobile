import { allowedFarms } from '@/features/plans/catalog';
import { usePlan } from '@/features/plans/use-plan';
import { useSelectedFarm } from '@/store/farm';

import { type Farm, useFarms } from './api';

/**
 * The farms this user's plan lets them work with, and the farm new records go to.
 * Lists filter by `filterFarmId`: the selected farm, or for plans with a farm
 * limit, their own farm(s) only.
 */
export function useWorkingFarm() {
  const plan = usePlan();
  const farmsQuery = useFarms();
  const selectedId = useSelectedFarm((s) => s.farmId);
  const { allowed, locked } = allowedFarms<Farm>(plan, farmsQuery.data ?? []);

  const selected = allowed.find((f) => f.id === selectedId) ?? null;
  // Records always need a concrete farm.
  const farmForNewRecords = selected ?? allowed[0] ?? null;
  // "All farms" only makes sense when the plan allows them all.
  const filterFarmId = selected?.id ?? (locked.length > 0 ? (allowed[0]?.id ?? null) : null);

  return {
    farms: allowed,
    lockedFarms: locked,
    farm: farmForNewRecords,
    filterFarmId,
    isLoading: farmsQuery.isPending && farmsQuery.fetchStatus !== 'idle',
  };
}
