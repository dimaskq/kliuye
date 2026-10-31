import { WATER_TILE_ZOOM, tilesWithin, waterAround } from '@/domain/coast';
import type { TileId, WaterAround, WaterTile } from '@/domain/coast';
import type { LatLng } from '@/domain/geo';

import { getBytes } from '../http';
import { keepNewest, readJson, storageKeys, writeJson } from '../storage';
import { tileUrl, vectorTileTemplate } from '../tiles';

import { readWaterLayer, readWaterwayLayer } from './mvt';

/**
 * Four decimals is about ten metres: two taps on the same bank share an answer,
 * a pond and the field beside it do not. Coarser than that and the forecast
 * key's two decimals — a kilometre — would let a field borrow the lake's "yes".
 */
const KEY_DIGITS = 4;
/** Far more points than anyone keeps; the oldest answers drop out first. */
const ANSWER_LIMIT = 400;

type Answers = Record<string, WaterAround>;

/** The `water` layer's class for the open sea; every other class is fresh water. */
const SEA_CLASS = 'ocean';
/** Water nobody fishes in, however blue it is on the map. */
const NOT_FISHABLE = new Set(['swimming_pool']);

function isAnswer(value: unknown): value is WaterAround {
  if (typeof value !== 'object' || value === null) return false;
  const { water, fresh } = value as Partial<WaterAround>;
  return typeof water === 'boolean' && typeof fresh === 'boolean';
}

function keyOf({ latitude, longitude }: LatLng, reachKm: number): string {
  return `${latitude.toFixed(KEY_DIGITS)},${longitude.toFixed(KEY_DIGITS)}@${reachKm}`;
}

function parseAnswers(input: unknown): Answers | undefined {
  if (typeof input !== 'object' || input === null) return undefined;
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => isAnswer(value)),
  ) as Answers;
}

/* One read per launch; later answers are merged into memory and written back. */
let answers: Promise<Answers> | undefined;

function loadAnswers(): Promise<Answers> {
  answers ??= readJson(storageKeys.waterNearby, parseAnswers).then((stored) => stored ?? {});
  return answers;
}

/** For tests: forget what this launch has read or learned. */
export function resetWaterNearbyCache(): void {
  answers = undefined;
}

async function waterTile(
  template: string,
  tile: TileId,
  signal: AbortSignal | undefined,
): Promise<WaterTile> {
  const bytes = await getBytes(tileUrl(template, tile), { signal });
  const water = readWaterLayer(bytes);
  const waterways = readWaterwayLayer(bytes);
  const features = (water?.features ?? []).filter(
    (feature) => !NOT_FISHABLE.has(feature.className ?? ''),
  );
  return {
    tile,
    extent: water?.extent ?? waterways?.extent ?? 0,
    polygons: features
      .filter((feature) => feature.className !== SEA_CLASS)
      .flatMap((feature) => feature.polygons),
    sea: features
      .filter((feature) => feature.className === SEA_CLASS)
      .flatMap((feature) => feature.polygons),
    lines: waterways?.lines ?? [],
  };
}

/**
 * Whether there is water within `reachKm` of the point, and whether any of it
 * is fresh. Asked
 * once per place and remembered for good; `undefined` when it cannot be told
 * right now, offline or with the tile server down, so a forecast is never
 * hidden on a guess.
 */
export async function waterNearby(
  point: LatLng,
  reachKm: number,
  signal?: AbortSignal,
): Promise<WaterAround | undefined> {
  const key = keyOf(point, reachKm);
  const known = await loadAnswers();
  if (key in known) return known[key];

  try {
    const template = await vectorTileTemplate(signal);
    const tiles = await Promise.all(
      tilesWithin(point, reachKm, WATER_TILE_ZOOM).map((tile) => waterTile(template, tile, signal)),
    );
    const nearby = waterAround(point, tiles, reachKm);
    known[key] = nearby;
    keepNewest(known, ANSWER_LIMIT);
    await writeJson(storageKeys.waterNearby, known);
    return nearby;
  } catch {
    return undefined;
  }
}
