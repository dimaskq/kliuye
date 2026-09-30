import {
  COAST_TILE_ZOOM,
  SEA_REACH_KM,
  distanceToSeaKm,
  isSeaWithinReach,
  pointInTile,
  tilesWithin,
} from '..';
import type { OceanTile, Polygon, TileId } from '..';

const EXTENT = 4096;
const ODESA = { latitude: 46.48, longitude: 30.72 };

function tileOf(point = ODESA): TileId {
  return tilesWithin(point, 0, COAST_TILE_ZOOM)[0]!;
}

/** A square of `size` tile units whose left edge sits `gap` units east of the point. */
function seaEastOf(gap: number, size = 200, point = ODESA): OceanTile {
  const tile = tileOf(point);
  const [x, y] = pointInTile(point, tile, EXTENT);
  const left = x + gap;
  const polygon: Polygon = [
    [
      [left, y - size],
      [left + size, y - size],
      [left + size, y + size],
      [left, y + size],
      [left, y - size],
    ],
  ];
  return { tile, extent: EXTENT, polygons: [polygon] };
}

/** Tile units per kilometre at the test point, measured rather than assumed. */
function unitsPerKm(point = ODESA): number {
  const tile = tileOf(point);
  const [x] = pointInTile(point, tile, EXTENT);
  const [east] = pointInTile({ ...point, longitude: point.longitude + 0.01 }, tile, EXTENT);
  const kmPerHundredthDegree = (111.32 * Math.cos((point.latitude * Math.PI) / 180)) / 100;
  return (east - x) / kmPerHundredthDegree;
}

describe('tilesWithin', () => {
  it('needs one tile for a point well inside it', () => {
    expect(tilesWithin(ODESA, SEA_REACH_KM, COAST_TILE_ZOOM)).toEqual([
      { z: COAST_TILE_ZOOM, x: 299, y: 181 },
    ]);
  });

  it('takes the neighbours a circle reaches across a tile corner', () => {
    /* The north-west corner of the tile Odesa is in. */
    const corner = { latitude: 46.558_86, longitude: 30.234_375 };
    expect(tilesWithin(corner, SEA_REACH_KM, COAST_TILE_ZOOM)).toHaveLength(4);
  });

  it('never asks for a tile past the edge of the world', () => {
    const tiles = tilesWithin({ latitude: 0, longitude: 179.99 }, SEA_REACH_KM, 2);
    expect(tiles.every((tile) => tile.x >= 0 && tile.x < 4 && tile.y >= 0 && tile.y < 4)).toBe(
      true,
    );
  });
});

describe('distanceToSeaKm', () => {
  it('is zero on the water', () => {
    expect(distanceToSeaKm(ODESA, [seaEastOf(-100)])).toBe(0);
  });

  it('measures the way to the nearest shore', () => {
    const twoKm = 2 * unitsPerKm();
    expect(distanceToSeaKm(ODESA, [seaEastOf(twoKm)])).toBeCloseTo(2, 1);
  });

  it('treats an island in the sea as land', () => {
    const sea = seaEastOf(-1000, 2000);
    const tile = sea.tile;
    const [x, y] = pointInTile(ODESA, tile, EXTENT);
    const island = [
      [x - 10, y - 10],
      [x - 10, y + 10],
      [x + 10, y + 10],
      [x + 10, y - 10],
      [x - 10, y - 10],
    ] as const;
    const withIsland: OceanTile = { ...sea, polygons: [[sea.polygons[0]![0]!, island]] };
    expect(distanceToSeaKm(ODESA, [withIsland])).toBeGreaterThan(0);
  });

  it('copes with a ring that repeats a vertex', () => {
    const sea = seaEastOf(50);
    const [ring] = sea.polygons[0]!;
    const repeated = [ring![0]!, ...ring!];
    expect(distanceToSeaKm(ODESA, [{ ...sea, polygons: [[repeated]] }])).toBeGreaterThan(0);
  });

  it('knows nothing when the tiles have no sea at all', () => {
    expect(distanceToSeaKm(ODESA, [])).toBeUndefined();
    expect(distanceToSeaKm(ODESA, [{ tile: tileOf(), extent: EXTENT, polygons: [] }])).toBe(
      undefined,
    );
  });
});

describe('isSeaWithinReach', () => {
  it(`counts sea up to ${SEA_REACH_KM} km away`, () => {
    expect(isSeaWithinReach(ODESA, [seaEastOf(4 * unitsPerKm())])).toBe(true);
  });

  it('does not count sea farther than that', () => {
    expect(isSeaWithinReach(ODESA, [seaEastOf(6 * unitsPerKm())])).toBe(false);
  });

  it('does not count a place with no sea anywhere near', () => {
    expect(isSeaWithinReach(ODESA, [])).toBe(false);
  });
});
