import { pointKey } from '@/domain/geo';
import type { LatLng } from '@/domain/geo';

import { lookupPlace } from './geocoder';
import type { PlaceName } from './geocoder';
import { readJson, storageKeys, writeJson } from './storage';

export type { PlaceName } from './geocoder';

/** Enough names for every point the app can remember, several times over. */
const CACHE_LIMIT = 120;

/** Name per rounded coordinate — the same key that decides "the same place". */
const names = new Map<string, PlaceName>();
let hydrated = false;

function asPlace(value: unknown): PlaceName | undefined {
  /* Earlier versions kept the settlement alone, as a string. */
  if (typeof value === 'string') return { name: value };
  if (typeof value !== 'object' || value === null) return undefined;
  const { name, area } = value as Record<string, unknown>;
  return {
    name: typeof name === 'string' ? name : undefined,
    area: typeof area === 'string' ? area : undefined,
  };
}

function parseCache(input: unknown): [string, PlaceName][] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((entry) => {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string') return [];
    const placeName = asPlace(entry[1]);
    return placeName === undefined ? [] : [[entry[0], placeName] as [string, PlaceName]];
  });
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  for (const [key, placeName] of (await readJson(storageKeys.places, parseCache)) ?? []) {
    names.set(key, placeName);
  }
}

function remember(key: string, placeName: PlaceName): void {
  /* Re-inserting moves the key to the end, so the oldest entry drops out. */
  names.delete(key);
  names.set(key, placeName);
  for (const oldest of names.keys()) {
    if (names.size <= CACHE_LIMIT) break;
    names.delete(oldest);
  }
  void writeJson(storageKeys.places, [...names]);
}

/**
 * What a coordinate is called: the nearest settlement and the district or
 * region it lies in. The answer is kept on disk, because geocoding needs a
 * connection: without the cache every remembered point would lose its name the
 * moment the angler arrives at a place with no signal. Empty when nobody knows.
 */
export async function describePlace(coordinates: LatLng): Promise<PlaceName> {
  await hydrate();
  const key = pointKey(coordinates);
  try {
    const found = await lookupPlace(coordinates);
    if (found === undefined) return names.get(key) ?? {};
    remember(key, found);
    return found;
  } catch {
    return names.get(key) ?? {};
  }
}

/** The settlement alone — or, with none, the district or region. */
export async function reverseGeocode(coordinates: LatLng): Promise<string | undefined> {
  const { name, area } = await describePlace(coordinates);
  return name ?? area;
}
