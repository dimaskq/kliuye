import { SPECIES_IDS } from '@/domain/bite-index';
import type { SpeciesId } from '@/domain/bite-index';

/** The catalogue chip is a gateway to the full list, not one of the choices. */
export const ALL_SPECIES: SpeciesId = 'all';

/**
 * The chosen fish comes first, so it is on screen whichever of the fifteen it
 * is. Everything else keeps catalogue order.
 */
export function speciesPillOrder(selected: SpeciesId): SpeciesId[] {
  const rest = SPECIES_IDS.filter((id) => id !== ALL_SPECIES && id !== selected);
  return selected === ALL_SPECIES ? rest : [selected, ...rest];
}
