import { catchStats } from '@/domain/diary';
import { useAngler, useDiary } from '@/store';

export type AnglerSummary = {
  trips: number;
  fish: number;
  recordKg: number;
  /** First logged catch, or the year the app was installed. */
  sinceYear: number;
};

/**
 * The header and the tiles read the diary, not a separate counter: there is one
 * source for "how many fish", and the angler can correct it by editing an entry.
 */
export function useAnglerSummary(): AnglerSummary {
  const catches = useDiary((state) => state.catches);
  const installedYear = useAngler((state) => state.sinceYear);
  const { trips, fish, recordKg, sinceYear } = catchStats(catches);
  return { trips, fish, recordKg, sinceYear: sinceYear ?? installedYear };
}
