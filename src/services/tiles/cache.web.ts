import { TILE_CACHE_NAME, tileUrl } from './tileMath';
import type { Tile } from './tileMath';

/**
 * The browser preview keeps tiles in the Cache Storage the page owns — the web
 * equivalent of the documents directory the app uses on a phone. Same keys,
 * same lifetime as the site's data, and it survives a reload offline.
 */
async function store(): Promise<Cache | undefined> {
  try {
    return await caches.open(TILE_CACHE_NAME);
  } catch {
    /* Private mode, or a browser with storage switched off. */
    return undefined;
  }
}

/** Native maps read tiles from a path; the browser reads them through fetch. */
export function tileCachePath(): string | undefined {
  return undefined;
}

export async function cacheTiles(tiles: readonly Tile[], signal?: AbortSignal): Promise<number> {
  const cache = await store();
  if (cache === undefined) return 0;

  let saved = 0;
  for (const tile of tiles) {
    if (signal?.aborted === true) break;
    const url = tileUrl(tile);
    try {
      if ((await cache.match(url)) !== undefined) continue;
      await cache.add(url);
      saved += 1;
    } catch {
      /* One tile short is a blank square, not a failure. */
    }
  }
  return saved;
}

export async function tileCacheSize(): Promise<number> {
  const cache = await store();
  if (cache === undefined) return 0;
  try {
    const responses = await Promise.all((await cache.keys()).map((key) => cache.match(key)));
    const sizes = await Promise.all(
      responses.map(async (response) => (await response?.blob())?.size ?? 0),
    );
    return sizes.reduce((total, size) => total + size, 0);
  } catch {
    return 0;
  }
}

export async function clearTileCache(): Promise<void> {
  try {
    await caches.delete(TILE_CACHE_NAME);
  } catch {
    /* Nothing cached, or storage is unavailable. */
  }
}
