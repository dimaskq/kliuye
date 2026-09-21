import { useCallback } from 'react';

import type { LatLng } from '@/domain/geo';
import { reverseGeocode } from '@/services/places';
import { useSelection } from '@/store';

import { useChoosePoint } from './useChoosePoint';

function samePoint(a: LatLng | undefined, b: LatLng): boolean {
  return a?.latitude === b.latitude && a.longitude === b.longitude;
}

/**
 * Choosing a point on the map: it takes effect at once, and its settlement name
 * arrives when the geocoder answers. A slow answer is dropped if the user has
 * moved the point on, or has already named it themselves.
 */
export function usePickPoint(): (coordinates: LatLng) => void {
  const choose = useChoosePoint();

  return useCallback(
    (coordinates: LatLng) => {
      choose({ ...coordinates, label: '' });
      void reverseGeocode(coordinates).then((name) => {
        if (name === undefined) return;
        const current = useSelection.getState().customPoint;
        if (!samePoint(current, coordinates) || current?.label !== '') return;
        choose({ ...coordinates, label: name });
      });
    },
    [choose],
  );
}
