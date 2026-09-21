import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UnitSystem } from '@/domain/units';
import { DEFAULT_LANGUAGE } from '@/i18n';
import type { Language } from '@/i18n';
import { storageKeys } from '@/services/storage';

/** Settings rows are data: adding one is an entry here plus two i18n keys. */
export const TOGGLE_IDS = ['offlineMaps', 'notifications'] as const;
export type ToggleId = (typeof TOGGLE_IDS)[number];

export type PreferencesState = {
  language: Language;
  unitSystem: UnitSystem;
  toggles: Record<ToggleId, boolean>;
  setLanguage: (language: Language) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setToggle: (id: ToggleId, value: boolean) => void;
};

const DEFAULT_TOGGLES: Record<ToggleId, boolean> = {
  /* On by default: an angler at the water is the one who needs the map most. */
  offlineMaps: true,
  notifications: false,
};

/** Keeps only switches that still exist; retired ones would linger in storage. */
function knownToggles(stored: Partial<Record<string, boolean>> | undefined) {
  const toggles = { ...DEFAULT_TOGGLES };
  for (const id of TOGGLE_IDS) {
    const value = stored?.[id];
    if (typeof value === 'boolean') toggles[id] = value;
  }
  return toggles;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,
      unitSystem: 'metric',
      toggles: DEFAULT_TOGGLES,
      setLanguage: (language) => set({ language }),
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setToggle: (id, value) => set((state) => ({ toggles: { ...state.toggles, [id]: value } })),
    }),
    {
      name: storageKeys.preferences,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language, unitSystem, toggles }) => ({ language, unitSystem, toggles }),
      /**
       * A stored settings object predates any toggle added later, and a missing
       * switch would render as neither on nor off. Defaults fill the gaps.
       */
      merge: (persisted, current) => {
        const stored = persisted as Partial<PreferencesState> | undefined;
        return { ...current, ...stored, toggles: knownToggles(stored?.toggles) };
      },
    },
  ),
);
