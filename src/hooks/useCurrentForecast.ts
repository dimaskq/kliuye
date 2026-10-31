import { useMemo } from 'react';

import type { Spot } from '@/domain/spots';
import { useSelection } from '@/store';

import { useActiveSpot } from './useActiveSpot';
import type { ActiveSpot } from './useActiveSpot';
import { buildBiteModel } from './useBiteModel';
import type { BiteModel } from './useBiteModel';
import { useForecast } from './useForecast';
import type { ForecastState } from './useForecast';
import { useOnWater } from './useOnWater';

export type CurrentForecast = ForecastState &
  Omit<ActiveSpot, 'spot'> & {
    spot: Spot;
    /** Undefined while loading or after a failure with no cache. */
    model: BiteModel | undefined;
    /**
     * True when the point is plainly on land. A bite index for a field or a
     * desert means nothing, and showing one made every number look random.
     */
    onLand: boolean;
  };

/** The single read path every screen uses: selection + forecast → derived model. */
export function useCurrentForecast(): CurrentForecast {
  const speciesId = useSelection((state) => state.speciesId);
  const selectedHour = useSelection((state) => state.selectedHour);
  const active = useActiveSpot();
  const { spot } = active;
  const state = useForecast(spot);
  const { forecast } = state;

  const model = useMemo(
    () =>
      forecast === undefined ? undefined : buildBiteModel(forecast, spot, speciesId, selectedHour),
    [forecast, spot, speciesId, selectedHour],
  );

  const onLand = useOnWater(spot) === false;

  return { ...state, ...active, model, onLand };
}
