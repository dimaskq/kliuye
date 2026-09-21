import { useCallback } from 'react';

import type { CustomPoint } from '@/domain/spots';
import { usePoints, useSelection } from '@/store';

/**
 * Making a point the active one. Every way of choosing — a tap on the map, a
 * search result, a row in the recent or saved lists — goes through here, so the
 * recent list never misses one.
 */
export function useChoosePoint(): (point: CustomPoint) => void {
  const setCustomPoint = useSelection((state) => state.setCustomPoint);
  const remember = usePoints((state) => state.remember);

  return useCallback(
    (point: CustomPoint) => {
      setCustomPoint(point);
      remember(point);
    },
    [remember, setCustomPoint],
  );
}
