import { create } from 'zustand';

type FarmState = {
  /** null = all farms, like the web dashboard's "All Farms". */
  farmId: string | null;
  setFarmId: (farmId: string | null) => void;
};

export const useSelectedFarm = create<FarmState>()((set) => ({
  farmId: null,
  setFarmId: (farmId) => set({ farmId }),
}));
