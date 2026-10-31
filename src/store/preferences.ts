import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UnitSystem } from '@/domain/units';
import { detectLanguage } from '@/i18n';
import type { Language } from '@/i18n';
import { storageKeys } from '@/services/storage';

/** Settings rows are data: adding one is an entry here plus two i18n keys. */
export const TOGGLE_IDS = ['offlineMaps', 'notifications', 'crashReports'] as const;
export type ToggleId = (typeof TOGGLE_IDS)[number];

/**
 * The looks the map can take, like the layer button in Google Maps — all from
 * free, keyless sources built on OpenStreetMap. No satellite view: no free
 * imagery comes without a key or a non-commercial licence.
 */
export const MAP_LAYERS = ['standard', 'terrain', 'light', 'dark'] as const;
export type MapLayer = (typeof MAP_LAYERS)[number];

/** Follow the phone, or keep one theme whatever the phone says. */
export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export type PreferencesState = {
  language: Language;
  unitSystem: UnitSystem;
  toggles: Record<ToggleId, boolean>;
  /** How the map looks: plain, with relief, light or dark. */
  mapLayer: MapLayer;
  setMapLayer: (layer: MapLayer) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  /** The first-launch tour was seen through or skipped. */
  onboardingDone: boolean;
  /** The "where does this number come from" card on Today was read or put away. */
  explainerSeen: boolean;
  /** The tour that lights up the main parts of Today was seen through or skipped. */
  featureTourDone: boolean;
  /** True once the stored settings were read; nothing first-launch shows before. */
  hydrated: boolean;
  finishOnboarding: () => void;
  dismissExplainer: () => void;
  finishFeatureTour: () => void;
  /** Both tours and the index card, once more — from Settings. */
  replayTours: () => void;
  setLanguage: (language: Language) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setToggle: (id: ToggleId, value: boolean) => void;
};

const DEFAULT_TOGGLES: Record<ToggleId, boolean> = {
  /* On by default: an angler at the water is the one who needs the map most. */
  offlineMaps: true,
  notifications: false,
  /* Off until the angler says yes: nothing leaves the phone without consent. */
  crashReports: false,
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
      /* The device language on first launch; once the user picks one, the stored choice wins. */
      language: detectLanguage(),
      unitSystem: 'metric',
      toggles: DEFAULT_TOGGLES,
      mapLayer: 'standard',
      setMapLayer: (mapLayer) => set({ mapLayer }),
      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode }),
      onboardingDone: false,
      explainerSeen: false,
      featureTourDone: false,
      hydrated: false,
      finishOnboarding: () => set({ onboardingDone: true }),
      dismissExplainer: () => set({ explainerSeen: true }),
      finishFeatureTour: () => set({ featureTourDone: true }),
      replayTours: () =>
        set({ onboardingDone: false, explainerSeen: false, featureTourDone: false }),
      setLanguage: (language) => set({ language }),
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setToggle: (id, value) => set((state) => ({ toggles: { ...state.toggles, [id]: value } })),
    }),
    {
      name: storageKeys.preferences,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        unitSystem: state.unitSystem,
        toggles: state.toggles,
        mapLayer: state.mapLayer,
        themeMode: state.themeMode,
        onboardingDone: state.onboardingDone,
        explainerSeen: state.explainerSeen,
        featureTourDone: state.featureTourDone,
      }),
      onRehydrateStorage: () => () => {
        usePreferences.setState({ hydrated: true });
      },
      /**
       * A stored settings object predates any toggle added later, and a missing
       * switch would render as neither on nor off. Defaults fill the gaps.
       */
      merge: (persisted, current) => {
        const stored = persisted as Partial<PreferencesState> | undefined;
        return {
          ...current,
          ...stored,
          toggles: knownToggles(stored?.toggles),
          /* A layer a later version dropped falls back to the plain map. */
          mapLayer: MAP_LAYERS.includes(stored?.mapLayer as MapLayer)
            ? (stored?.mapLayer as MapLayer)
            : 'standard',
          themeMode: THEME_MODES.includes(stored?.themeMode as ThemeMode)
            ? (stored?.themeMode as ThemeMode)
            : 'system',
          /* Someone upgrading has used the app already and needs no tour. */
          onboardingDone: stored?.onboardingDone ?? stored !== undefined,
        };
      },
    },
  ),
);
