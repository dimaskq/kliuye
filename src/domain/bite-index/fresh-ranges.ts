import type { LatLng } from '../geo';

import type { SpeciesId } from './types';

/**
 * Where the freshwater fish live. A carp is caught on four continents, but a
 * wels catfish in Africa or a zander in Japan is not, and a pond high in the
 * mountains holds trout rather than carp. Outside its range, or above its
 * altitude, a species is ruled out the way a cod is in the Black Sea.
 */
export const FRESH_REGIONS = ['europe', 'northAsia', 'eastAsia', 'northAmerica'] as const;
export type FreshRegion = (typeof FRESH_REGIONS)[number];

/** [south, west, north, east], in degrees. */
type Box = readonly [number, number, number, number];

/**
 * Rough boxes, first hit wins. Europe runs to the Urals and takes in Turkey and
 * the Caucasus, but stops short of the African shore. A point in none of them
 * — Africa, South America, Australia, the tropics — is "elsewhere": only the
 * fish people have carried all over the world are caught there.
 */
const REGION_BOXES: readonly (readonly [FreshRegion, readonly Box[]])[] = [
  [
    'europe',
    [
      [36.0, -11.0, 72.0, -1.5],
      [37.6, -1.5, 72.0, 12.0],
      [34.5, 12.0, 72.0, 60.0],
    ],
  ],
  /* South of the Amur: China, Korea, Japan. */
  ['eastAsia', [[18.0, 97.0, 45.0, 146.0]]],
  /* Kazakhstan, Siberia, the Amur. */
  [
    'northAsia',
    [
      [42.0, 60.0, 78.0, 97.0],
      [45.0, 97.0, 78.0, 180.0],
    ],
  ],
  ['northAmerica', [[25.0, -170.0, 75.0, -50.0]]],
];

function inBox({ latitude, longitude }: LatLng, [south, west, north, east]: Box): boolean {
  return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
}

/** The freshwater region of a point; `undefined` means "elsewhere", not "unknown". */
export function freshRegionAt(point: LatLng): FreshRegion | undefined {
  return REGION_BOXES.find(([, boxes]) => boxes.some((box) => inBox(point, box)))?.[0];
}

/**
 * Where each freshwater fish lives. Missing from the table — carp and trout —
 * means it has been stocked nearly everywhere and is never ruled out by place.
 */
export const FRESH_RANGES: Partial<Record<SpeciesId, readonly FreshRegion[]>> = {
  /* Northern pike and yellow perch: the whole cold north of the world. */
  pike: ['europe', 'northAsia', 'northAmerica'],
  perch: ['europe', 'northAsia', 'northAmerica'],
  zander: ['europe', 'northAsia'],
  bream: ['europe', 'northAsia'],
  roach: ['europe', 'northAsia'],
  /* The wels: Europe to the Aral and Balkhash. */
  catfish: ['europe', 'northAsia'],
  /* Crucian and Prussian carp, at home from Europe to Japan. */
  crucian: ['europe', 'northAsia', 'eastAsia'],
};

/**
 * Above this height, in metres, the water is too cold and too poor for the
 * species. Approximate, from where anglers actually catch them; trout has no
 * ceiling — the mountains are where it lives.
 */
export const MAX_ELEVATION_M: Partial<Record<SpeciesId, number>> = {
  pike: 1800,
  perch: 1800,
  roach: 1500,
  crucian: 1500,
  carp: 1200,
  bream: 900,
  zander: 700,
  catfish: 600,
};

/**
 * False only when the species is known not to live there. Where the region
 * could not be worked out at all — no coordinates — nothing is ruled out.
 */
export function livesInFresh(
  species: SpeciesId,
  region: FreshRegion | undefined,
  located: boolean,
): boolean {
  const range = FRESH_RANGES[species];
  if (range === undefined || !located) return true;
  return region !== undefined && range.includes(region);
}

/**
 * Below this height, in metres, the summer water is too warm for the species —
 * outside the cold lowlands. Trout keeps to mountain streams in the south and
 * the east: there is none in the Donbas steppe, by Kyiv or in Florida.
 */
export const MIN_ELEVATION_M: Partial<Record<SpeciesId, number>> = {
  trout: 400,
};

/**
 * Where lowland rivers stay cold enough through the summer for trout: rough
 * boxes, like the regions above.
 */
const COLD_LOWLAND_BOXES: readonly Box[] = [
  /* Atlantic Europe: Ireland and Britain, France, Germany, the Alps' foothills
     to Denmark and Norway; but not the Po valley or the Danube plain. */
  [46.0, -11.0, 72.0, 16.0],
  /* Galicia, Asturias, the Basque country and Gascony. */
  [43.0, -11.0, 46.0, 3.0],
  /* The Baltic shore and the north: Pomerania, the Baltic states, Finland, Karelia. */
  [54.0, 16.0, 72.0, 45.0],
  /* North America from Oregon and New England up. */
  [40.0, -170.0, 75.0, -50.0],
];

export function coldLowlandAt(point: LatLng): boolean {
  return COLD_LOWLAND_BOXES.some((box) => inBox(point, box));
}

/** False when the spot is higher than the species is ever caught. */
export function livesAt(species: SpeciesId, elevationM: number | undefined): boolean {
  const ceiling = MAX_ELEVATION_M[species];
  return ceiling === undefined || elevationM === undefined || elevationM <= ceiling;
}

/**
 * False when the spot is lower than the species is ever caught and its lowland
 * is a warm one. With no height, or no place, nothing is ruled out.
 */
export function livesLow(
  species: SpeciesId,
  elevationM: number | undefined,
  coldLowland: boolean | undefined,
): boolean {
  const floor = MIN_ELEVATION_M[species];
  if (floor === undefined || elevationM === undefined || coldLowland !== false) return true;
  return elevationM >= floor;
}
