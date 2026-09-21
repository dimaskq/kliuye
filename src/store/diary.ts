import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { makeCatchId } from '@/domain/diary';
import type { Catch, CatchDraft } from '@/domain/diary';
import { storageKeys } from '@/services/storage';

/** Bumped when the shape of a stored entry changes. */
const DIARY_VERSION = 1;

/** What version 0 wrote: everything a catch has today, except the photos. */
type LegacyCatch = Omit<Catch, 'media'> & { media?: Catch['media'] };

export type DiaryState = {
  catches: Catch[];
  add: (draft: CatchDraft) => void;
  update: (id: string, draft: CatchDraft) => void;
  remove: (id: string) => void;
};

/**
 * The angler's own record. Local only: no account, nothing leaves the device
 * (STORE_REVIEW.md §2).
 */
export const useDiary = create<DiaryState>()(
  persist(
    (set) => ({
      catches: [],
      add: (draft) =>
        set((state) => ({
          catches: [{ ...draft, id: makeCatchId(Date.now(), Math.random()) }, ...state.catches],
        })),
      update: (id, draft) =>
        set((state) => ({
          catches: state.catches.map((entry) => (entry.id === id ? { ...draft, id } : entry)),
        })),
      remove: (id) =>
        set((state) => ({ catches: state.catches.filter((entry) => entry.id !== id) })),
    }),
    {
      name: storageKeys.diary,
      storage: createJSONStorage(() => AsyncStorage),
      version: DIARY_VERSION,
      /* Entries written before photos existed have no `media` array. */
      migrate: (persisted) => {
        const stored = persisted as { catches?: LegacyCatch[] } | undefined;
        return {
          catches: (stored?.catches ?? []).map((entry) => ({ ...entry, media: entry.media ?? [] })),
        } as DiaryState;
      },
    },
  ),
);
