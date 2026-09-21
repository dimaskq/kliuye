import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storageKeys } from '@/services/storage';

/**
 * A purely local profile: no account, no server, nothing to delete remotely
 * (STORE_REVIEW.md §2). Catches live in the diary; what is left here is the
 * angler themselves.
 */
export type AnglerState = {
  displayName: string;
  /** A photo in the app's own storage; '' shows the initials instead. */
  avatarUri: string;
  /** Year of first launch, used as "since {{year}}" until a catch is logged. */
  sinceYear: number;
  setDisplayName: (displayName: string) => void;
  setAvatarUri: (avatarUri: string) => void;
};

export const useAngler = create<AnglerState>()(
  persist(
    (set) => ({
      displayName: '',
      avatarUri: '',
      sinceYear: new Date().getFullYear(),
      setDisplayName: (displayName) => set({ displayName }),
      setAvatarUri: (avatarUri) => set({ avatarUri }),
    }),
    { name: storageKeys.angler, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** "Тарас Коваль" → "ТК"; an empty name falls back to the app's own initial. */
export function initialsOf(displayName: string, fallback: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
