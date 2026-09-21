import type { LatLng } from '@/domain/geo';

export type Tile = { z: number; x: number; y: number };

/**
 * OpenStreetMap's own tiles: no key, no billing, and the same source the web
 * preview already uses — at the cost of the attribution shown on the map.
 */
export const TILE_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/** The browser preview's tile store; the phone keeps its own on disk. */
export const TILE_CACHE_NAME = 'kliuye-tiles-v1';

/** Country level down to "which bay of the reservoir" — the zooms the app uses. */
export const TILE_MIN_ZOOM = 8;
export const TILE_MAX_ZOOM = 13;
export const TILE_SIZE = 256;

/** A morning's drive around the point, which is what "this area" means here. */
export const AREA_RADIUS_KM = 12;

/** A ceiling on one area, so a single prefetch can never run away. */
export const MAX_TILES_PER_AREA = 300;

const KM_PER_DEGREE = 111.32;
/** Web Mercator is undefined at the poles; every provider cuts it here. */
const MAX_LATITUDE = 85.0511;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function tileX(longitude: number, zoom: number): number {
  const count = 2 ** zoom;
  return clamp(Math.floor(((longitude + 180) / 360) * count), 0, count - 1);
}

export function tileY(latitude: number, zoom: number): number {
  const count = 2 ** zoom;
  const radians = toRadians(clamp(latitude, -MAX_LATITUDE, MAX_LATITUDE));
  const projected = (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
  return clamp(Math.floor(projected * count), 0, count - 1);
}

export function tileUrl({ z, x, y }: Tile): string {
  return TILE_URL_TEMPLATE.replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y));
}

type Bounds = { north: number; south: number; west: number; east: number };

function boundsAround(centre: LatLng, radiusKm: number): Bounds {
  const lat = radiusKm / KM_PER_DEGREE;
  /* Degrees of longitude shrink towards the poles; degrees of latitude do not. */
  const lon = lat / Math.max(Math.cos(toRadians(centre.latitude)), 0.01);
  return {
    north: centre.latitude + lat,
    south: centre.latitude - lat,
    west: centre.longitude - lon,
    east: centre.longitude + lon,
  };
}

/** Fills one zoom level; false once the ceiling is reached. */
function pushZoom(tiles: Tile[], z: number, bounds: Bounds, limit: number): boolean {
  for (let x = tileX(bounds.west, z); x <= tileX(bounds.east, z); x += 1) {
    for (let y = tileY(bounds.north, z); y <= tileY(bounds.south, z); y += 1) {
      if (tiles.length >= limit) return false;
      tiles.push({ z, x, y });
    }
  }
  return true;
}

/**
 * Every tile covering a square around the point, coarsest zoom first: if a
 * prefetch is cut short, what survives is the level that still shows the whole
 * lake rather than one street of it.
 *
 * Near the date line the span is clipped at the edge of the world rather than
 * wrapped — a fishing app has nothing to show at 180 degrees anyway.
 */
export function tilesAround(
  centre: LatLng,
  radiusKm: number = AREA_RADIUS_KM,
  limit: number = MAX_TILES_PER_AREA,
): Tile[] {
  const bounds = boundsAround(centre, radiusKm);
  const tiles: Tile[] = [];
  for (let z = TILE_MIN_ZOOM; z <= TILE_MAX_ZOOM; z += 1) {
    if (!pushZoom(tiles, z, bounds, limit)) break;
  }
  return tiles;
}
