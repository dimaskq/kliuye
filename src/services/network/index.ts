import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

export type NetworkSnapshot = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

/**
 * Reachability is the honest answer, but Android reports it as `null` while it
 * is still probing, and iOS never reports it at all. Only an explicit "no" is
 * treated as offline: a wrong "online" costs one failed request, a wrong
 * "offline" would keep the app from ever refreshing.
 */
export function isOnlineState(state: NetworkSnapshot): boolean {
  if (state.isConnected === false) return false;
  return state.isInternetReachable !== false;
}

async function readState(): Promise<boolean> {
  try {
    return isOnlineState(await Network.getNetworkStateAsync());
  } catch {
    return true;
  }
}

let watching = false;

/**
 * Hands the device's connectivity to React Query, which is what makes the whole
 * app offline-aware at once: paused fetches instead of failed ones, an automatic
 * refetch when the signal comes back, and one shared flag the screens can read.
 */
export function startNetworkWatch(): void {
  if (watching) return;
  watching = true;

  onlineManager.setEventListener((setOnline) => {
    void readState().then(setOnline);
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(isOnlineState(state));
    });
    return () => subscription.remove();
  });
}

export function isOnline(): boolean {
  return onlineManager.isOnline();
}

/** Subscribes to connectivity changes; returns the unsubscribe function. */
export function subscribeToNetwork(listener: () => void): () => void {
  return onlineManager.subscribe(listener);
}
