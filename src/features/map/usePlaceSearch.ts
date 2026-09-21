import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useIsOnline } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { MIN_QUERY_LENGTH, searchPlaces } from '@/services/geocoding';
import type { Place } from '@/services/geocoding';
import { usePreferences } from '@/store';

const DEBOUNCE_MS = 350;
const STALE_TIME_MS = 10 * 60 * 1000;

export type PlaceSearch = {
  places: Place[];
  isSearching: boolean;
  /** True once a settled query returned nothing. */
  isEmpty: boolean;
  /** Searching needs the network; cached queries still answer without it. */
  isOffline: boolean;
};

/** Settlement search, debounced and cached, in the interface language. */
export function usePlaceSearch(query: string): PlaceSearch {
  const language = usePreferences((state) => state.language);
  const online = useIsOnline();
  const settled = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const enabled = settled.length >= MIN_QUERY_LENGTH;

  const search = useQuery({
    queryKey: ['places', language, settled],
    queryFn: ({ signal }) => searchPlaces(settled, language, signal),
    enabled,
    staleTime: STALE_TIME_MS,
  });

  const places = search.data ?? [];
  return {
    places,
    isSearching: enabled && online && search.isPending,
    isEmpty: enabled && search.isSuccess && places.length === 0,
    isOffline: enabled && !online && places.length === 0,
  };
}

/**
 * "Find" without waiting for the debounce: the top match for the query, from
 * the same cache the live results use. Nothing on a short query, an empty
 * answer or a failed request — the live results then say why.
 */
export function useFindPlace(): (query: string) => Promise<Place | undefined> {
  const client = useQueryClient();
  const language = usePreferences((state) => state.language);

  return useCallback(
    async (query: string) => {
      const settled = query.trim();
      if (settled.length < MIN_QUERY_LENGTH) return undefined;
      try {
        const places = await client.fetchQuery({
          queryKey: ['places', language, settled],
          queryFn: ({ signal }) => searchPlaces(settled, language, signal),
          staleTime: STALE_TIME_MS,
        });
        return places[0];
      } catch {
        return undefined;
      }
    },
    [client, language],
  );
}
