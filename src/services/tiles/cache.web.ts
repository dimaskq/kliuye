import { TILE_CACHE_NAME } from './tileMath';
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

export function savedMapStyle(): unknown {
  return undefined;
}

/**
 * The preview draws OpenStreetMap's raster tiles, whose policy forbids fetching
 * ahead of the viewer. It keeps only the tiles it has drawn (see
 * `cachedTiles.web.ts`), so there is nothing to prefetch here.
 */
export function cacheTiles(_tiles: readonly Tile[], _signal?: AbortSignal): Promise<number> {
  return Promise.resolve(0);
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
