import L from 'leaflet';

import { TILE_CACHE_NAME } from '@/services/tiles';

/**
 * Cache first, network second. A tile that was drawn once is served from the
 * browser's own Cache Storage from then on, which is what lets the preview keep
 * showing the map after the connection drops — and what fills the cache in the
 * first place, without a separate download step.
 *
 * Tiles are never revalidated: OpenStreetMap's imagery changes far more slowly
 * than a fishing trip lasts, and the settings screen can empty the store.
 */
async function loadTile(url: string): Promise<string> {
  const cache = await caches.open(TILE_CACHE_NAME).catch(() => undefined);
  const hit = await cache?.match(url);
  if (hit !== undefined) return URL.createObjectURL(await hit.blob());

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Tile request failed with status ${response.status}`);
  await cache?.put(url, response.clone());
  return URL.createObjectURL(await response.blob());
}

type TileLayerConstructor = new (url: string, options?: L.TileLayerOptions) => L.TileLayer;

const CachedTileLayer = L.TileLayer.extend({
  createTile(this: L.TileLayer, coords: L.Coords, done: L.DoneCallback): HTMLImageElement {
    const tile = document.createElement('img');
    tile.alt = '';
    loadTile(this.getTileUrl(coords)).then(
      (source) => {
        tile.src = source;
        done(undefined, tile);
      },
      (error: Error) => done(error, tile),
    );
    return tile;
  },
}) as unknown as TileLayerConstructor;

/** A tile layer that keeps what it draws; blob URLs are released on unload. */
export function cachedTileLayer(url: string, options: L.TileLayerOptions): L.TileLayer {
  const layer = new CachedTileLayer(url, options);
  layer.on('tileunload', (event) => {
    const image = (event as L.TileEvent).tile;
    if (image instanceof HTMLImageElement) URL.revokeObjectURL(image.src);
  });
  return layer;
}
