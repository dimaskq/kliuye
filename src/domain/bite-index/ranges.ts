import type { LatLng } from '../geo';

import type { SpeciesId } from './types';

/**
 * The seas the app knows, and which sea fish live in each. A pin off Varna has
 * no cod in it and a pin in a Norwegian fjord has no horse mackerel, whatever
 * the weather says — so outside its own seas a species is ruled out, the same
 * way a carp is out at sea.
 */
export const SEA_REGIONS = ['blackSea', 'mediterranean', 'baltic', 'northAtlantic'] as const;
export type SeaRegion = (typeof SEA_REGIONS)[number];

/** [south, west, north, east], in degrees. */
type Box = readonly [number, number, number, number];

/**
 * Rough boxes, tested in this order — the first hit wins, so the Baltic is
 * carved out of the North Atlantic and the Black Sea out of the Mediterranean.
 * They only need to be right where there is sea: on land the sea check has
 * already ruled the sea fish out.
 */
const REGION_BOXES: readonly (readonly [SeaRegion, readonly Box[]])[] = [
  /* The Black Sea, the Sea of Azov and the Sea of Marmara. */
  ['blackSea', [[40.3, 26.0, 47.8, 42.0]]],
  /* East of the Danish straits; the Gulf of Bothnia, but not the Helgeland coast. */
  [
    'baltic',
    [
      [53.5, 12.5, 60.0, 30.5],
      [60.0, 16.5, 66.0, 30.5],
    ],
  ],
  [
    'mediterranean',
    [
      [30.0, -6.0, 46.0, 26.0],
      [30.0, 26.0, 40.3, 36.5],
    ],
  ],
  /* The British Isles, the North Sea and the Skagerrak; Norway and Iceland; the
     coast of Finnmark and the Barents Sea. Kept off the mainland of Europe. */
  [
    'northAtlantic',
    [
      [48.0, -25.0, 60.0, 12.5],
      [60.0, -25.0, 72.5, 16.5],
      [66.0, 16.5, 72.5, 45.0],
    ],
  ],
];

function inBox({ latitude, longitude }: LatLng, [south, west, north, east]: Box): boolean {
  return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
}

/** The sea a point belongs to, or `undefined` where the app does not know the fish. */
export function seaRegionAt(point: LatLng): SeaRegion | undefined {
  return REGION_BOXES.find(([, boxes]) => boxes.some((box) => inBox(point, box)))?.[0];
}

/**
 * Where each sea fish lives. A species missing here — every freshwater one —
 * has no range limit; a point outside every known sea rules nothing out.
 */
export const SEA_RANGES: Partial<Record<SpeciesId, readonly SeaRegion[]>> = {
  /* Black Sea flounder (glossa) in the south, European flounder in the north. */
  flounder: ['blackSea', 'baltic', 'northAtlantic'],
  turbot: ['blackSea', 'mediterranean', 'baltic', 'northAtlantic'],
  mullet: ['blackSea', 'mediterranean'],
  horseMackerel: ['blackSea', 'mediterranean'],
  /* Comes in from the Sea of Marmara; nothing like it in the north. */
  bluefish: ['blackSea', 'mediterranean'],
  /* Ponto-Caspian gobies; the round goby has spread through the Baltic. */
  goby: ['blackSea', 'mediterranean', 'baltic'],
  saithe: ['northAtlantic'],
  cod: ['northAtlantic', 'baltic'],
  mackerel: ['northAtlantic', 'mediterranean'],
  salmon: ['northAtlantic', 'baltic'],
  halibut: ['northAtlantic'],
};

/** False only when the species is known not to live in this sea. */
export function livesIn(species: SpeciesId, region: SeaRegion | undefined): boolean {
  const range = SEA_RANGES[species];
  return range === undefined || region === undefined || range.includes(region);
}
