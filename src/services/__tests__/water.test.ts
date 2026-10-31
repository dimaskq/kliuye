import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpResponse, http } from 'msw';

import {
  PICKED_WATER_REACH_KM,
  WATER_TILE_ZOOM,
  distanceToWaterKm,
  pointInTile,
  tilesWithin,
} from '@/domain/coast';
import { encodeTile, square } from '@tests/factories/mvt';
import { server } from '@tests/msw/server';

import { TILEJSON_URL, readWaterwayLayer } from '../coast';
import { decodeLines, decodePolygons } from '../coast/geometry';
import type * as WaterModule from '../coast/water';
import { storageKeys } from '../storage';

const water = jest.requireActual<typeof WaterModule>('../coast/water');

const TILE_URL = 'https://tiles.example.test/planet/{z}/{x}/{y}.pbf';
/* A point on the Kyiv reservoir, and a field well inland. */
const LAKE = { latitude: 50.75, longitude: 30.45 };
const FIELD = { latitude: 50.3, longitude: 31.9 };

/** A tile holding one square of water around `at`, `half` tile units each way. */
/** Where the point falls in its own tile, in whole tile units as a tile stores them. */
function gridOf(at: typeof LAKE) {
  const [tile] = tilesWithin(at, 0, WATER_TILE_ZOOM);
  const [x, y] = pointInTile(at, tile!, 4096).map(Math.round) as [number, number];
  return { tile: tile!, x, y };
}

function tileWithWaterAt(at: typeof LAKE, half: number, kind = 'lake'): Uint8Array {
  const { x, y } = gridOf(at);
  return encodeTile([
    {
      name: 'water',
      features: [{ properties: { class: kind }, rings: [square(x - half, y - half, half * 2)] }],
    },
  ]);
}

function serve(tile: Uint8Array): void {
  server.use(
    http.get(TILEJSON_URL, () => HttpResponse.json({ tiles: [TILE_URL] })),
    http.get('https://tiles.example.test/planet/:z/:x/:y', () =>
      HttpResponse.arrayBuffer(tile.slice().buffer),
    ),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(async () => {
  jest.useRealTimers();
  water.resetWaterNearbyCache();
  await AsyncStorage.removeItem(storageKeys.waterNearby);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('waterNearby', () => {
  it('says a point on a lake is on fresh water', async () => {
    serve(tileWithWaterAt(LAKE, 50));
    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: true,
      fresh: true,
    });
  });

  it('says a point out at sea is on water, but not on fresh water', async () => {
    serve(tileWithWaterAt(LAKE, 50, 'ocean'));
    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: true,
      fresh: false,
    });
  });

  it('does not take a swimming pool for water to fish', async () => {
    serve(tileWithWaterAt(LAKE, 50, 'swimming_pool'));
    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: false,
      fresh: false,
    });
  });

  it('says no for a field with no water anywhere near', async () => {
    serve(encodeTile([{ name: 'transportation', features: [] }]));
    await expect(water.waterNearby(FIELD, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: false,
      fresh: false,
    });
  });

  it('counts a river drawn only as a line', async () => {
    const { x, y } = gridOf(LAKE);
    serve(
      encodeTile([
        {
          name: 'waterway',
          features: [
            {
              type: 2,
              properties: { class: 'river' },
              rings: [
                [
                  [x - 100, y + 5],
                  [x + 100, y + 5],
                ],
              ],
            },
          ],
        },
      ]),
    );
    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: true,
      fresh: true,
    });
  });

  it('remembers the answer, so the next visit costs no request', async () => {
    serve(tileWithWaterAt(LAKE, 50));
    await water.waterNearby(LAKE, PICKED_WATER_REACH_KM);
    server.resetHandlers();

    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: true,
      fresh: true,
    });
  });

  it('reads what an earlier launch learned, and ignores anything malformed', async () => {
    await AsyncStorage.setItem(
      storageKeys.waterNearby,
      JSON.stringify({ '50.7500,30.4500@0.3': { water: true, fresh: true }, broken: true }),
    );
    water.resetWaterNearbyCache();
    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: true,
      fresh: true,
    });
  });

  it('starts afresh when the stored answers are not an object', async () => {
    await AsyncStorage.setItem(storageKeys.waterNearby, JSON.stringify(42));
    water.resetWaterNearbyCache();
    serve(tileWithWaterAt(LAKE, 50));
    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toEqual({
      water: true,
      fresh: true,
    });
  });

  it('cannot tell without the tile server, and says so instead of guessing', async () => {
    server.use(http.get(TILEJSON_URL, () => new HttpResponse(null, { status: 404 })));
    await expect(water.waterNearby(LAKE, PICKED_WATER_REACH_KM)).resolves.toBeUndefined();
  });
});

describe('readWaterwayLayer', () => {
  it('reads river lines and skips everything else', () => {
    const layer = readWaterwayLayer(
      encodeTile([
        {
          name: 'waterway',
          features: [
            {
              type: 2,
              rings: [
                [
                  [0, 0],
                  [10, 0],
                  [10, 10],
                ],
              ],
            },
          ],
        },
      ]),
    );
    expect(layer?.lines).toEqual([
      [
        [0, 0],
        [10, 0],
        [10, 10],
      ],
    ]);
  });
});

describe('distanceToWaterKm', () => {
  it('is zero on the water and grows with distance from it', () => {
    const [tile] = tilesWithin(LAKE, 0, WATER_TILE_ZOOM);
    const [x, y] = pointInTile(LAKE, tile!, 4096);
    const tiles = [
      {
        tile: tile!,
        extent: 4096,
        polygons: [[square(x - 10, y - 10, 20)]],
        lines: [],
      },
    ];
    expect(distanceToWaterKm(LAKE, tiles)).toBe(0);
    const east = { ...LAKE, longitude: LAKE.longitude + 0.01 };
    expect(distanceToWaterKm(east, tiles)).toBeGreaterThan(0.5);
  });

  it('measures to a stream given as a single point, and to a multi-part line', () => {
    const { tile, x, y } = gridOf(LAKE);
    /* Rounded to the tile grid, so a metre or so off — well inside any reach. */
    expect(
      distanceToWaterKm(LAKE, [{ tile, extent: 4096, polygons: [], lines: [[[x, y]]] }]),
    ).toBeLessThan(0.01);
    const layer = readWaterwayLayer(
      encodeTile([
        {
          name: 'waterway',
          features: [
            {
              type: 2,
              rings: [
                [
                  [0, 0],
                  [5, 0],
                ],
                [
                  [20, 20],
                  [30, 20],
                ],
              ],
            },
          ],
        },
      ]),
    );
    expect(layer?.lines).toHaveLength(2);
  });

  it('has no waterway layer to read in a tile without rivers', () => {
    expect(readWaterwayLayer(encodeTile([{ name: 'water', features: [] }]))).toBeUndefined();
  });

  it('has no answer when the tiles hold no water', () => {
    expect(distanceToWaterKm(LAKE, [])).toBeUndefined();
  });
});

describe('vector tile geometry', () => {
  /* Command integers: id in the low three bits, repeat count above them. */
  const command = (id: number, count: number): number => (count << 3) | id;
  const MOVE = 1;
  const LINE = 2;
  const CLOSE = 7;
  const UNKNOWN = 5;

  it('ignores a stray close and an unknown command instead of inventing rings', () => {
    expect(decodePolygons([command(CLOSE, 1), command(UNKNOWN, 1), 0, 0])).toEqual([]);
  });

  it('drops a line segment that has no starting point', () => {
    expect(decodeLines([command(LINE, 1), 2, 2, command(UNKNOWN, 1), 0, 0])).toEqual([]);
  });

  it('reads a line that starts with a move', () => {
    expect(
      decodeLines([command(MOVE, 1), 2, 2, command(LINE, 1), 2, 0, command(CLOSE, 1)]),
    ).toEqual([
      [
        [1, 1],
        [2, 1],
      ],
    ]);
  });
});
