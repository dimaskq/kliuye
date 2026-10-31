import {
  HABITATS,
  IN_SEASON_FROM,
  activityIn,
  profileFor,
  ruledOutFor,
  speciesOf,
} from '@/domain/bite-index';
import type { BiteInputs, Habitat, RuledOut, SpeciesId } from '@/domain/bite-index';

type RuledOutInputs = Pick<
  BiteInputs,
  'seaRegion' | 'freshRegion' | 'located' | 'elevationM' | 'coldLowland'
>;

export type SpeciesRow = {
  id: SpeciesId;
  value: number;
  /** Optimal water band, and whether the month is one this fish is taken in. */
  optimum: readonly [number, number];
  inSeason: boolean;
  /** Why this fish cannot be caught at the spot this month at all, if it cannot. */
  ruledOut: RuledOut | undefined;
};

export type SpeciesGroup = {
  habitat: Habitat;
  rows: SpeciesRow[];
};

/**
 * The catalogue split by habitat, each species carrying the index it would give
 * for the water in view. Groups come from the profile table, so a new species
 * lands in the right section without touching this screen.
 */
export function speciesGroups(
  scores: Readonly<Record<SpeciesId, number>>,
  month: number,
  /** Whether the spot has sea within reach; `undefined` rules nothing out. */
  seaNearby?: boolean,
  /** Whether the spot is on fresh water; `undefined` rules nothing out. */
  freshwaterNearby?: boolean,
  /** Where the spot is and how high: which fish can be there at all. */
  place: RuledOutInputs = {},
): SpeciesGroup[] {
  return HABITATS.map((habitat) => ({
    habitat,
    rows: speciesOf(habitat).map((id) => {
      const profile = profileFor(id);
      return {
        id,
        value: scores[id],
        optimum: profile.optimalWaterC,
        inSeason: activityIn(profile.activity, month) >= IN_SEASON_FROM,
        ruledOut: ruledOutFor({ species: id, month, seaNearby, freshwaterNearby, ...place }),
      };
    }),
  })).filter((group) => group.rows.length > 0);
}
