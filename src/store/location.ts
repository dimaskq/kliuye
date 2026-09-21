import { create } from 'zustand';

import type { LatLng } from '@/domain/geo';

/** `idle` means we have never asked — the prompt is never shown on launch. */
export type LocationStatus = 'idle' | 'granted' | 'denied';

export type LocationState = {
  status: LocationStatus;
  origin: LatLng | undefined;
  /** Settlement name for the header, when reverse geocoding could supply one. */
  city: string | undefined;
  /** True once the stored permission has been read, so we ask at most once. */
  hydrated: boolean;
  setDenied: () => void;
  setPosition: (origin: LatLng, city: string | undefined) => void;
  setHydrated: () => void;
};

/**
 * Shared across screens, and deliberately not persisted: a stale fix would put
 * the forecast in the wrong place after the user has travelled.
 */
export const useLocation = create<LocationState>()((set) => ({
  status: 'idle',
  origin: undefined,
  city: undefined,
  hydrated: false,
  setDenied: () => set({ status: 'denied', origin: undefined, city: undefined, hydrated: true }),
  setPosition: (origin, city) => set({ status: 'granted', origin, city, hydrated: true }),
  setHydrated: () => set({ hydrated: true }),
}));
