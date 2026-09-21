import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Spot } from '@/domain/spots';

export type SpotLabel = {
  name: string;
  meta: string;
  region: string;
};

/**
 * The one place a spot becomes words. A named point carries its settlement and
 * its coordinates as interpolations, so reading a key without its params would
 * print `{{place}}` instead of a name.
 */
export function useSpotLabel(): (spot: Spot) => SpotLabel {
  const { t } = useTranslation();

  return useCallback(
    (spot: Spot) => ({
      name: t(spot.nameKey, spot.nameParams ?? {}),
      meta: t(spot.metaKey, spot.metaParams ?? {}),
      region: t(spot.regionKey, spot.regionParams ?? {}),
    }),
    [t],
  );
}
