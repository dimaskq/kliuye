import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { pointKey } from '@/domain/geo';
import type { CustomPoint } from '@/domain/spots';
import { storageKeys } from '@/services/storage';

/** Enough to get back to last weekend's spots without becoming a second list. */
export const RECENT_LIMIT = 10;

export type PointsState = {
  /** Most recently picked first. */
  recent: CustomPoint[];
  favourites: CustomPoint[];
  /** Records a pick, or refreshes the name of one already remembered. */
  remember: (point: CustomPoint) => void;
  toggleFavourite: (point: CustomPoint) => void;
  /** Saves a point, or renames it if it is already saved; never unsaves. */
  keep: (point: CustomPoint) => void;
  forget: (point: CustomPoint) => void;
};

/** Replaces any entry for the same place, keeping the newest label. */
function withPoint(list: readonly CustomPoint[], point: CustomPoint): CustomPoint[] {
  const key = pointKey(point);
  return [point, ...list.filter((entry) => pointKey(entry) !== key)];
}

function without(list: readonly CustomPoint[], point: CustomPoint): CustomPoint[] {
  const key = pointKey(point);
  return list.filter((entry) => pointKey(entry) !== key);
}

export function includesPoint(list: readonly CustomPoint[], point: CustomPoint): boolean {
  const key = pointKey(point);
  return list.some((entry) => pointKey(entry) === key);
}

/**
 * The places the angler has been and the ones worth keeping. Local only —
 * nothing here leaves the device (STORE_REVIEW.md §2).
 */
export const usePoints = create<PointsState>()(
  persist(
    (set) => ({
      recent: [],
      favourites: [],
      remember: (point) =>
        set((state) => ({ recent: withPoint(state.recent, point).slice(0, RECENT_LIMIT) })),
      toggleFavourite: (point) =>
        set((state) => ({
          favourites: includesPoint(state.favourites, point)
            ? without(state.favourites, point)
            : withPoint(state.favourites, point),
        })),
      keep: (point) => set((state) => ({ favourites: withPoint(state.favourites, point) })),
      forget: (point) => set((state) => ({ recent: without(state.recent, point) })),
    }),
    { name: storageKeys.points, storage: createJSONStorage(() => AsyncStorage) },
  ),
);
