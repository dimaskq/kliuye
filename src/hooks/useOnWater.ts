import { useEffect, useState } from 'react';

import { LOCATED_WATER_REACH_KM, PICKED_WATER_REACH_KM } from '@/domain/coast';
import type { WaterAround } from '@/domain/coast';
import { CURRENT_LOCATION_SPOT_ID, CUSTOM_SPOT_ID } from '@/domain/spots';
import type { Spot } from '@/domain/spots';
import { waterNearby } from '@/services/coast';

import { useIsOnline } from './useIsOnline';

/** The bundled waters are reservoirs: water, and fresh, by definition. */
const KNOWN_FRESH_WATER: WaterAround = { water: true, fresh: true };

/** How close the water must be: a picked point is exact, the device's own position is not. */
function reachFor(spotId: string): number | undefined {
  if (spotId === CUSTOM_SPOT_ID) return PICKED_WATER_REACH_KM;
  if (spotId === CURRENT_LOCATION_SPOT_ID) return LOCATED_WATER_REACH_KM;
  return undefined;
}

/**
 * What water the spot stands on — any, and fresh. `undefined` while it is not
 * known (no signal, the tile server down), and then nothing is ruled out, so
 * the check can never take a working screen away.
 */
export function useWaterAround(spot: Pick<Spot, 'id' | 'coordinates'>): WaterAround | undefined {
  const online = useIsOnline();
  const reach = reachFor(spot.id);
  const { latitude, longitude } = spot.coordinates;
  const [answer, setAnswer] = useState<{ key: string; around: WaterAround | undefined }>();
  const key = `${latitude},${longitude}@${reach ?? ''}`;

  useEffect(() => {
    if (reach === undefined) return undefined;
    const controller = new AbortController();
    void waterNearby({ latitude, longitude }, reach, controller.signal).then((around) => {
      if (!controller.signal.aborted) setAnswer({ key, around });
    });
    return () => controller.abort();
    /* Asked again when the signal returns, in case the first try had none. */
  }, [key, latitude, longitude, online, reach]);

  if (reach === undefined) return KNOWN_FRESH_WATER;
  return answer?.key === key ? answer.around : undefined;
}

/** Whether the spot is on water; only an outright `false` hides the index. */
export function useOnWater(spot: Pick<Spot, 'id' | 'coordinates'>): boolean | undefined {
  return useWaterAround(spot)?.water;
}
