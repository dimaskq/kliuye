import { useQuery } from '@tanstack/react-query';

import type { Spot } from '@/domain/spots';
import { FORECAST_CACHE_TIME_MS, FORECAST_STALE_TIME_MS, forecastQueryKey } from '@/services/query';
import { fetchForecast } from '@/services/weather';
import type { Forecast } from '@/services/weather';

import { useIsOnline } from './useIsOnline';

export type ForecastState = {
  forecast: Forecast | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  /** True while showing data we could not refresh — drives the "data from" badge. */
  isStale: boolean;
  refetch: () => void;
};

export function useForecast(spot: Spot): ForecastState {
  const online = useIsOnline();
  const query = useQuery({
    queryKey: forecastQueryKey(spot.id, spot.coordinates),
    queryFn: ({ signal }) => fetchForecast(spot.coordinates, new Date(), signal),
    staleTime: FORECAST_STALE_TIME_MS,
    gcTime: FORECAST_CACHE_TIME_MS,
  });

  return {
    forecast: query.data,
    isLoading: query.isPending,
    isRefreshing: query.isFetching && !query.isPending,
    error: query.isError ? query.error : undefined,
    /* Offline counts as stale even before a refresh has failed: the cache is
       what is on screen, and the badge says how old it is. */
    isStale: query.data !== undefined && (query.isError || !online),
    refetch: () => void query.refetch(),
  };
}
