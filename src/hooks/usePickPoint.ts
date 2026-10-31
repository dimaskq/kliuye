import { useCallback } from 'react';

import type { LatLng } from '@/domain/geo';
import { describePlace } from '@/services/places';
import { useSelection } from '@/store';

import { useChoosePoint } from './useChoosePoint';

function samePoint(a: LatLng | undefined, b: LatLng): boolean {
  return a?.latitude === b.latitude && a.longitude === b.longitude;
}

/**
 * Choosing a point on the map: it takes effect at once, and its settlement and
 * region arrive when the geocoder answers. A slow answer is dropped if the user has
 * moved the point on, or has already named it themselves.
 */
export function usePickPoint(): (coordinates: LatLng) => void {
  const choose = useChoosePoint();

  return useCallback(
    (coordinates: LatLng) => {
      choose({ ...coordinates, label: '' });
      void describePlace(coordinates).then(({ name, area }) => {
        if (name === undefined && area === undefined) return;
        const current = useSelection.getState().customPoint;
        if (!samePoint(current, coordinates) || current?.label !== '') return;
        choose({ ...coordinates, label: name ?? '', area });
      });
    },
    [choose],
  );
}
