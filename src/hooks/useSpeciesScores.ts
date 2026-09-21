import { useMemo } from 'react';

import { SPECIES_IDS } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';
import type { Spot } from '@/domain/spots';
import type { Forecast } from '@/services/weather';

import { scoreValueAt } from './useBiteModel';

/** The index each species would show at one hour — the numbers on the chips. */
export function useSpeciesScores(
  forecast: Forecast | undefined,
  spot: Spot,
  hour: number,
): Record<SpeciesId, number> {
  return useMemo(
    () =>
      Object.fromEntries(
        SPECIES_IDS.map((species) => [
          species,
          forecast === undefined ? 0 : (scoreValueAt(forecast, spot, species, hour) ?? 0),
        ]),
      ) as Record<SpeciesId, number>,
    [forecast, spot, hour],
  );
}
