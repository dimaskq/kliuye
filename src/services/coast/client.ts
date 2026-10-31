import { COAST_TILE_ZOOM, SEA_REACH_KM, isSeaWithinReach, tilesWithin } from '@/domain/coast';
import type { OceanTile, TileId } from '@/domain/coast';
import { pointKey } from '@/domain/geo';
import type { LatLng } from '@/domain/geo';

import { getBytes } from '../http';
import { keepNewest, readJson, storageKeys, writeJson } from '../storage';
import { TILEJSON_URL, vectorTileTemplate } from '../tiles/source';

import { readWaterLayer } from './mvt';

/*
 * The same OpenFreeMap vector tiles the map draws, so the check sends nothing
 * to a service the app does not already talk to.
 */
export { TILEJSON_URL };

const OCEAN_CLASS = 'ocean';

type Answers = Record<string, boolean>;

/** Far more points than anyone keeps; the oldest answers drop out first. */
const ANSWER_LIMIT = 400;

function parseAnswers(input: unknown): Answers | undefined {
  if (typeof input !== 'object' || input === null) return undefined;
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value === 'boolean'),
  ) as Answers;
}

/* One read per launch; later answers are merged into memory and written back. */
let answers: Promise<Answers> | undefined;

function loadAnswers(): Promise<Answers> {
  answers ??= readJson(storageKeys.seaNearby, parseAnswers).then((stored) => stored ?? {});
  return answers;
}

/** For tests: forget what this launch has read or learned. */
export function resetSeaNearbyCache(): void {
  answers = undefined;
}

async function oceanTile(
  template: string,
  tile: TileId,
  signal: AbortSignal | undefined,
): Promise<OceanTile> {
  const url = template
    .replace('{z}', String(tile.z))
    .replace('{x}', String(tile.x))
    .replace('{y}', String(tile.y));
  const water = readWaterLayer(await getBytes(url, { signal }));
  return {
    tile,
    extent: water?.extent ?? 0,
    polygons: (water?.features ?? [])
      .filter((feature) => feature.className === OCEAN_CLASS)
      .flatMap((feature) => feature.polygons),
  };
}

/**
 * Whether there is sea within `SEA_REACH_KM` of the point. Asked once per
 * place and remembered for good; `undefined` when it cannot be told right now —
 * offline, or the tile server is down — so nothing gets ruled out on a guess.
 */
export async function isSeaNearby(
  point: LatLng,
  signal?: AbortSignal,
): Promise<boolean | undefined> {
  const key = pointKey(point);
  const known = await loadAnswers();
  if (key in known) return known[key];

  try {
    const template = await vectorTileTemplate(signal);
    const tiles = await Promise.all(
      tilesWithin(point, SEA_REACH_KM, COAST_TILE_ZOOM).map((tile) =>
        oceanTile(template, tile, signal),
      ),
    );
    const nearby = isSeaWithinReach(point, tiles);
    known[key] = nearby;
    keepNewest(known, ANSWER_LIMIT);
    await writeJson(storageKeys.seaNearby, known);
    return nearby;
  } catch {
    return undefined;
  }
}
