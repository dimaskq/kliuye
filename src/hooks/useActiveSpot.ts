import { useMemo } from 'react';

import { CURRENT_LOCATION_SPOT_ID, resolveSpot } from '@/domain/spots';
import type { Spot } from '@/domain/spots';
import { useLocation, useSelection } from '@/store';

import { useDeviceLocation } from './useDeviceLocation';

export type ActiveSpot = {
  spot: Spot;
  /** True while the forecast is for the device's own position. */
  isCurrentLocation: boolean;
  /** Settlement shown in the header, when reverse geocoding supplied one. */
  city: string | undefined;
  /**
   * True when we have never asked for a position, nothing was chosen by hand and
   * the dialog was not put off. Waits for the stored permission to be read, so it
   * never flashes up for someone who already said yes.
   */
  canOfferLocation: boolean;
};

/** The water every screen forecasts for. Resolution itself lives in the domain. */
export function useActiveSpot(): ActiveSpot {
  const selectedId = useSelection((state) => state.selectedSpotId);
  const customPoint = useSelection((state) => state.customPoint);
  const { status, origin, city } = useDeviceLocation();
  const hydrated = useLocation((state) => state.hydrated);
  const promptDismissed = useLocation((state) => state.promptDismissed);

  return useMemo(() => {
    const spot = resolveSpot({ selectedId, origin, city, customPoint });
    return {
      spot,
      isCurrentLocation: spot.id === CURRENT_LOCATION_SPOT_ID,
      city,
      canOfferLocation:
        hydrated && !promptDismissed && status === 'idle' && selectedId === undefined,
    };
  }, [city, customPoint, hydrated, origin, promptDismissed, selectedId, status]);
}
