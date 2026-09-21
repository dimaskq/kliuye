import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import type { Query } from '@tanstack/react-query';

import { COORDINATE_PRECISION } from '@/domain/geo';
import type { LatLng } from '@/domain/geo';

import { STORAGE_VERSION, storageKeys } from './storage';

/** Fresh for half an hour: after that a screen in the foreground refetches. */
export const FORECAST_STALE_TIME_MS = 30 * 60 * 1000;

/**
 * How long an answer survives without ever being refreshed. A week is far past
 * the point where a forecast is right, but a stale forecast on a lake with no
 * signal — labelled with the hour it came from — beats an empty screen, and it
 * is the same week's worth of tiles the offline map keeps.
 */
export const FORECAST_CACHE_TIME_MS = 7 * 24 * 60 * 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FORECAST_STALE_TIME_MS,
        gcTime: FORECAST_CACHE_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
        /** Offline: show the cache rather than an empty screen. */
        networkMode: 'offlineFirst',
      },
    },
  });
}

export function createPersister() {
  return createAsyncStoragePersister({ storage: AsyncStorage, key: storageKeys.queryCache });
}

/**
 * What gets written to disk, and therefore what exists after a cold start with
 * no signal: every settled answer — forecasts, marine data, place searches —
 * and nothing half-finished. `buster` ties the file to the storage version, so
 * a schema change drops it instead of rehydrating a shape we no longer read.
 */
export function persistOptions(persister: ReturnType<typeof createPersister>) {
  return {
    persister,
    maxAge: FORECAST_CACHE_TIME_MS,
    buster: `v${STORAGE_VERSION}`,
    dehydrateOptions: {
      shouldDehydrateQuery: (query: Query): boolean => query.state.status === 'success',
    },
  };
}

/**
 * Keyed by the coordinates the request actually carries, not by the spot id
 * alone: a picked point keeps its id while it moves, so an id-only key served a
 * cached forecast for wherever the pin used to be.
 */
export const forecastQueryKey = (
  spotId: string,
  { latitude, longitude }: LatLng,
): readonly [string, string, string, string] => [
  'forecast',
  spotId,
  latitude.toFixed(COORDINATE_PRECISION),
  longitude.toFixed(COORDINATE_PRECISION),
];
