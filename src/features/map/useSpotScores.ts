import { useQueries } from '@tanstack/react-query';

import type { SpeciesId } from '@/domain/bite-index';
import type { SpotWithDistance } from '@/domain/spots';
import { scoreValueAt } from '@/hooks';
import { FORECAST_CACHE_TIME_MS, FORECAST_STALE_TIME_MS, forecastQueryKey } from '@/services/query';
import { fetchForecast } from '@/services/weather';

export type ScoredSpot = SpotWithDistance & {
  /** `undefined` until that spot's own forecast has arrived. */
  value: number | undefined;
};

/** What the water check said about one spot — the only one it is asked about. */
export type FreshwaterAnswer = { spotId: string; freshwaterNearby: boolean | undefined };

/** One cached forecast per water, so each pin shows that water's own index. */
export function useSpotScores(
  spots: readonly SpotWithDistance[],
  species: SpeciesId,
  hour: number,
  water?: FreshwaterAnswer,
): ScoredSpot[] {
  const results = useQueries({
    queries: spots.map((spot) => ({
      queryKey: forecastQueryKey(spot.id, spot.coordinates),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchForecast(spot.coordinates, new Date(), signal),
      staleTime: FORECAST_STALE_TIME_MS,
      gcTime: FORECAST_CACHE_TIME_MS,
    })),
  });

  return spots.map((spot, index) => {
    const fetched = results[index]?.data;
    const forecast =
      fetched === undefined || water?.spotId !== spot.id
        ? fetched
        : { ...fetched, freshwaterNearby: water.freshwaterNearby };
    const value = forecast === undefined ? undefined : scoreValueAt(forecast, spot, species, hour);
    return { ...spot, value };
  });
}
