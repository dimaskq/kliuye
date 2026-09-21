import * as Location from 'expo-location';

import { pointKey } from '@/domain/geo';
import type { LatLng } from '@/domain/geo';

import { readJson, storageKeys, writeJson } from './storage';

/** Enough names for every point the app can remember, several times over. */
const CACHE_LIMIT = 120;

/** Name per rounded coordinate — the same key that decides "the same place". */
const names = new Map<string, string>();
let hydrated = false;

function parseCache(input: unknown): [string, string][] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (entry): entry is [string, string] =>
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === 'string' &&
      typeof entry[1] === 'string',
  );
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  for (const [key, name] of (await readJson(storageKeys.places, parseCache)) ?? []) {
    names.set(key, name);
  }
}

function remember(key: string, name: string): void {
  /* Re-inserting moves the key to the end, so the oldest entry drops out. */
  names.delete(key);
  names.set(key, name);
  for (const oldest of names.keys()) {
    if (names.size <= CACHE_LIMIT) break;
    names.delete(oldest);
  }
  void writeJson(storageKeys.places, [...names]);
}

/**
 * Nearest settlement for a coordinate, via the operating system's own geocoder:
 * free, no third-party vendor and nothing extra to declare in the store forms.
 *
 * The answer is kept on disk, because the geocoder needs a connection on both
 * platforms: without the cache every remembered point would lose its name the
 * moment the angler arrives at a place with no signal.
 *
 * It has no web implementation, so in the browser this returns `undefined` and
 * the point is labelled by its coordinates instead of a guess.
 */
export async function reverseGeocode(coordinates: LatLng): Promise<string | undefined> {
  await hydrate();
  const key = pointKey(coordinates);

  try {
    const [place] = await Location.reverseGeocodeAsync(coordinates);
    const name = place?.city ?? place?.subregion ?? place?.district ?? place?.region ?? undefined;
    if (name === undefined) return names.get(key);
    remember(key, name);
    return name;
  } catch {
    return names.get(key);
  }
}
