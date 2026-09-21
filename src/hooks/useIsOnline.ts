import { useSyncExternalStore } from 'react';

import { isOnline, subscribeToNetwork } from '@/services/network';

/**
 * The one connectivity flag the interface reads. It follows React Query's own
 * online manager, so what the screens show and what the queries do can never
 * disagree.
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeToNetwork, isOnline, () => true);
}
