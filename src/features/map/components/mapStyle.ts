import type { LngLat, StyleSpecification } from '@maplibre/maplibre-react-native';

import type { LatLng } from '@/domain/geo';
import { TILE_MAX_ZOOM, TILE_MIN_ZOOM, TILE_SIZE } from '@/services/tiles';
import { colors } from '@/ui';

/**
 * OpenFreeMap: free vector maps with no key, no account and no usage limits,
 * built from OpenStreetMap data.
 */
export const ONLINE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export const ONLINE_ATTRIBUTION = '© OpenFreeMap © OpenMapTiles © OpenStreetMap';
export const OFFLINE_ATTRIBUTION = '© OpenStreetMap';

/**
 * Without a connection the map is drawn from the OpenStreetMap tiles the app
 * prefetched to disk. Beyond their deepest zoom MapLibre scales the last tile
 * up, so a half-covered area still shows a map rather than a grid of holes.
 */
export function offlineStyle(tileCacheUri: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      saved: {
        type: 'raster',
        tiles: [`${tileCacheUri.replace(/\/+$/, '')}/{z}/{x}/{y}`],
        tileSize: TILE_SIZE,
        minzoom: TILE_MIN_ZOOM,
        maxzoom: TILE_MAX_ZOOM,
      },
    },
    layers: [
      { id: 'ground', type: 'background', paint: { 'background-color': colors.surface } },
      { id: 'saved', type: 'raster', source: 'saved' },
    ],
  };
}

/** MapLibre speaks [longitude, latitude]; the app speaks { latitude, longitude }. */
export function toLngLat({ latitude, longitude }: LatLng): LngLat {
  return [longitude, latitude];
}

export function fromLngLat([longitude, latitude]: LngLat): LatLng {
  return { latitude, longitude };
}
