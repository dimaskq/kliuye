import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { HOURS_PER_DAY } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';
import { CUSTOM_SPOT_ID } from '@/domain/spots';
import type { CustomPoint } from '@/domain/spots';
import { storageKeys } from '@/services/storage';

/** `-1` closes the week accordion; only one day is ever open. */
export const NO_DAY_SELECTED = -1;

export type SelectionState = {
  speciesId: SpeciesId;
  selectedHour: number;
  selectedDayIndex: number;
  selectedSpotId: string | undefined;
  /** A point tapped on the map or found by searching; survives a restart. */
  customPoint: CustomPoint | undefined;
  setSpecies: (speciesId: SpeciesId) => void;
  setHour: (hour: number) => void;
  /** Moves by whole hours from wherever we are, so rapid taps do not coalesce. */
  stepHour: (delta: number) => void;
  toggleDay: (dayIndex: number) => void;
  setSpot: (spotId: string) => void;
  /** Picking a point also makes it the active choice. */
  setCustomPoint: (point: CustomPoint) => void;
};

export const useSelection = create<SelectionState>()(
  persist(
    (set) => ({
      speciesId: 'all',
      selectedHour: 6,
      selectedDayIndex: 0,
      selectedSpotId: undefined,
      customPoint: undefined,
      setSpecies: (speciesId) => set({ speciesId }),
      setHour: (selectedHour) => set({ selectedHour }),
      stepHour: (delta) =>
        set((state) => ({
          selectedHour: Math.max(0, Math.min(HOURS_PER_DAY - 1, state.selectedHour + delta)),
        })),
      toggleDay: (dayIndex) =>
        set((state) => ({
          selectedDayIndex: state.selectedDayIndex === dayIndex ? NO_DAY_SELECTED : dayIndex,
        })),
      setSpot: (selectedSpotId) => set({ selectedSpotId }),
      setCustomPoint: (customPoint) => set({ customPoint, selectedSpotId: CUSTOM_SPOT_ID }),
    }),
    {
      name: storageKeys.selection,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
