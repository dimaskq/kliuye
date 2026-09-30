import type { LatLng } from '../geo';

/**
 * Is there sea within reach of a spot? Answered from the `ocean` polygons of a
 * vector map tile, so it works anywhere the map does — the Black Sea, a
 * Norwegian fjord — and a reservoir or a river never counts as sea.
 */

/** How far from the spot the sea may be for sea fish to count as catchable. */
export const SEA_REACH_KM = 5;

/**
 * One zoom-9 tile is 40–80 km across in the latitudes we fish, so a 5 km circle
 * almost always needs a single tile, and its outline is still accurate to tens
 * of metres.
 */
export const COAST_TILE_ZOOM = 9;

export type TileId = { z: number; x: number; y: number };

/** A ring of tile-local points, `[x, y]`, in the tile's own 0..extent grid. */
export type Ring = readonly (readonly [number, number])[];

/** One polygon — its outer ring and holes — as a vector tile stores it. */
export type Polygon = readonly Ring[];

export type OceanTile = {
  tile: TileId;
  /** The size of the tile's coordinate grid, 4096 in practice. */
  extent: number;
  polygons: readonly Polygon[];
};

const EARTH_RADIUS_M = 6_371_008.8;

/** Web Mercator, with the whole world as the unit square and y growing south. */
function toWorld({ latitude, longitude }: LatLng): [number, number] {
  const sin = Math.sin((latitude * Math.PI) / 180);
  return [(longitude + 180) / 360, 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)];
}

/** Metres per world unit at a latitude — Mercator stretches away from the equator. */
function metresPerWorldUnit(latitude: number): number {
  return 2 * Math.PI * EARTH_RADIUS_M * Math.cos((latitude * Math.PI) / 180);
}

/** Where the point falls in a tile's own 0..extent grid; outside the tile it runs past 0 or extent. */
export function pointInTile(point: LatLng, tile: TileId, extent: number): [number, number] {
  const [x, y] = toWorld(point);
  const scale = extent * 2 ** tile.z;
  return [x * scale - tile.x * extent, y * scale - tile.y * extent];
}

/** Every tile at `zoom` that a circle of `radiusKm` around the point touches. */
export function tilesWithin(point: LatLng, radiusKm: number, zoom: number): TileId[] {
  const [x, y] = toWorld(point);
  const reach = (radiusKm * 1000) / metresPerWorldUnit(point.latitude);
  const count = 2 ** zoom;
  const clamp = (value: number): number => Math.min(count - 1, Math.max(0, Math.floor(value)));

  const tiles: TileId[] = [];
  for (let tx = clamp((x - reach) * count); tx <= clamp((x + reach) * count); tx += 1) {
    for (let ty = clamp((y - reach) * count); ty <= clamp((y + reach) * count); ty += 1) {
      tiles.push({ z: zoom, x: tx, y: ty });
    }
  }
  return tiles;
}

/** Even-odd ray cast: a point inside a hole is outside the polygon. */
function isInside(x: number, y: number, polygon: Polygon): boolean {
  let inside = false;
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i]!;
      const [xj, yj] = ring[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function distanceToSegment(
  x: number,
  y: number,
  [ax, ay]: readonly [number, number],
  [bx, by]: readonly [number, number],
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared));
  return Math.hypot(ax + t * dx - x, ay + t * dy - y);
}

/** Distance, in world units, from the point to one polygon; 0 inside it. */
function distanceToPolygon(x: number, y: number, polygon: Polygon): number {
  if (isInside(x, y, polygon)) return 0;
  let nearest = Infinity;
  for (const ring of polygon) {
    for (let i = 1; i < ring.length; i += 1) {
      nearest = Math.min(nearest, distanceToSegment(x, y, ring[i - 1]!, ring[i]!));
    }
  }
  return nearest;
}

/**
 * Kilometres from the point to the nearest sea in the given tiles, 0 when the
 * point is on the water, `undefined` when none of them has any sea at all.
 */
export function distanceToSeaKm(point: LatLng, tiles: readonly OceanTile[]): number | undefined {
  let nearest = Infinity;

  for (const { tile, extent, polygons } of tiles) {
    const scale = extent * 2 ** tile.z;
    const [x, y] = pointInTile(point, tile, extent);
    for (const polygon of polygons) {
      nearest = Math.min(nearest, distanceToPolygon(x, y, polygon) / scale);
    }
  }

  return nearest === Infinity ? undefined : (nearest * metresPerWorldUnit(point.latitude)) / 1000;
}

/** The yes/no the bite index needs: is the sea close enough to fish it? */
export function isSeaWithinReach(point: LatLng, tiles: readonly OceanTile[]): boolean {
  const distance = distanceToSeaKm(point, tiles);
  return distance !== undefined && distance <= SEA_REACH_KM;
}
