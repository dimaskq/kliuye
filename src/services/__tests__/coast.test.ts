import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpResponse, http } from 'msw';

import { COAST_TILE_ZOOM, pointInTile, tilesWithin } from '@/domain/coast';
import { bytesField, encodeTile, hole, square } from '@tests/factories/mvt';
import { server } from '@tests/msw/server';

import { TILEJSON_URL, isSeaNearby, readWaterLayer, resetSeaNearbyCache } from '../coast';
import { storageKeys } from '../storage';

const TILE_URL = 'https://tiles.example.test/planet/{z}/{x}/{y}.pbf';
const ODESA = { latitude: 46.48, longitude: 30.72 };
const KYIV = { latitude: 50.45, longitude: 30.52 };

describe('readWaterLayer', () => {
  it('reads the water layer, its classes and its extent', () => {
    const tile = encodeTile([
      {
        name: 'transportation',
        features: [{ properties: { class: 'motorway' }, rings: [square(0, 0, 5)] }],
      },
      {
        name: 'water',
        extent: 512,
        features: [
          { properties: { class: 'ocean' }, rings: [square(0, 0, 10)] },
          { properties: { class: 'lake' }, rings: [square(20, 20, 5)] },
        ],
      },
    ]);
    const water = readWaterLayer(tile);
    expect(water?.extent).toBe(512);
    expect(water?.features.map((feature) => feature.className)).toEqual(['ocean', 'lake']);
    expect(water?.features[0]!.polygons).toEqual([
      [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    ]);
  });

  it('defaults the extent to 4096', () => {
    const water = readWaterLayer(encodeTile([{ name: 'water', features: [] }]));
    expect(water?.extent).toBe(4096);
  });

  it('files a hole under its polygon and a second outer ring as a new polygon', () => {
    const water = readWaterLayer(
      encodeTile([
        {
          name: 'water',
          features: [{ rings: [square(0, 0, 100), hole(10, 10, 20), square(200, 200, 10)] }],
        },
      ]),
    );
    const polygons = water!.features[0]!.polygons;
    expect(polygons).toHaveLength(2);
    expect(polygons[0]).toHaveLength(2);
    expect(polygons[1]).toHaveLength(1);
    expect(water!.features[0]!.className).toBeUndefined();
  });

  it('keeps a first ring wound the wrong way rather than dropping it', () => {
    const water = readWaterLayer(
      encodeTile([{ name: 'water', features: [{ rings: [hole(0, 0, 10)] }] }]),
    );
    expect(water!.features[0]!.polygons).toHaveLength(1);
  });

  it('ignores points and lines', () => {
    const water = readWaterLayer(
      encodeTile([{ name: 'water', features: [{ type: 2, rings: [square(0, 0, 10)] }] }]),
    );
    expect(water!.features).toEqual([]);
  });

  it('has nothing to say about a tile with no water', () => {
    expect(readWaterLayer(encodeTile([{ name: 'landcover', features: [] }]))).toBeUndefined();
    expect(readWaterLayer(new Uint8Array())).toBeUndefined();
  });

  it('skips fields it does not know, of every wire type', () => {
    const unknown = [
      ...[0x08 * 9, 42],
      ...[0x08 * 9 + 1, 0, 0, 0, 0, 0, 0, 0, 0],
      ...[0x08 * 9 + 5, 0, 0, 0, 0],
      ...bytesField(9, [1, 2, 3]),
    ];
    const layer = encodeTile([
      { name: 'water', features: [{ properties: { class: 'ocean' }, rings: [square(0, 0, 4)] }] },
    ]);
    const water = readWaterLayer(new Uint8Array([...unknown, ...layer]));
    expect(water?.features[0]?.className).toBe('ocean');
  });

  it('skips unknown fields inside a layer, a feature and a value', () => {
    const feature = bytesField(2, [0x08 * 9, 1, ...bytesField(4, [9, 0, 0])]);
    const value = bytesField(4, [0x08 * 9, 7]);
    const layer = bytesField(3, [
      ...bytesField(1, [...new TextEncoder().encode('water')]),
      0x08 * 9,
      1,
      ...feature,
      ...value,
    ]);
    const water = readWaterLayer(new Uint8Array(layer));
    expect(water?.features).toEqual([]);
  });

  it('survives a name that is not valid UTF-8', () => {
    const layer = bytesField(3, bytesField(1, [0xc3, 0x28]));
    expect(readWaterLayer(new Uint8Array(layer))).toBeUndefined();
  });

  it('rejects a truncated tile', () => {
    expect(() => readWaterLayer(new Uint8Array([0x1a, 0x10, 0x0a]))).toThrow(/Truncated/);
    expect(() => readWaterLayer(new Uint8Array([0x1a, 0x80]))).toThrow(/Truncated/);
  });

  it('rejects a wire type the format does not have', () => {
    expect(() => readWaterLayer(new Uint8Array([0x0b]))).toThrow(/wire type/);
  });
});

/** A tile whose ocean begins `gapUnits` tile units east of the point. */
function tileWithSeaEastOf(point: typeof ODESA, gapUnits: number): Uint8Array {
  const tile = tilesWithin(point, 0, COAST_TILE_ZOOM)[0]!;
  const [x, y] = pointInTile(point, tile, 4096);
  const left = Math.round(x + gapUnits);
  const top = Math.round(y - 500);
  return encodeTile([
    {
      name: 'water',
      features: [
        { properties: { class: 'ocean' }, rings: [square(left, top, 1000)] },
        {
          properties: { class: 'lake' },
          rings: [square(Math.round(x) - 5, Math.round(y) - 5, 10)],
        },
      ],
    },
  ]);
}

describe('isSeaNearby', () => {
  let tileRequests = 0;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(async () => {
    jest.useRealTimers();
    tileRequests = 0;
    resetSeaNearbyCache();
    await AsyncStorage.clear();
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  function serveTiles(tile: Uint8Array): void {
    server.use(
      http.get(TILEJSON_URL, () => HttpResponse.json({ tiles: [TILE_URL] })),
      http.get('https://tiles.example.test/planet/:z/:x/:y', () => {
        tileRequests += 1;
        return HttpResponse.arrayBuffer(tile.slice().buffer);
      }),
    );
  }

  it('finds the sea next to a coastal town', async () => {
    serveTiles(tileWithSeaEastOf(ODESA, 50));
    await expect(isSeaNearby(ODESA)).resolves.toBe(true);
  });

  it('does not take a lake for the sea', async () => {
    serveTiles(tileWithSeaEastOf(KYIV, 3000));
    await expect(isSeaNearby(KYIV)).resolves.toBe(false);
  });

  it('answers a tile with no water at all with no', async () => {
    serveTiles(encodeTile([{ name: 'landcover', features: [] }]));
    await expect(isSeaNearby(KYIV)).resolves.toBe(false);
  });

  it('asks once per place and remembers the answer across launches', async () => {
    serveTiles(tileWithSeaEastOf(ODESA, 50));
    await isSeaNearby(ODESA);
    await isSeaNearby(ODESA);
    expect(tileRequests).toBe(1);

    resetSeaNearbyCache();
    await expect(isSeaNearby(ODESA)).resolves.toBe(true);
    expect(tileRequests).toBe(1);
    expect(JSON.parse((await AsyncStorage.getItem(storageKeys.seaNearby))!)).toEqual({
      '46.48,30.72': true,
    });
  });

  it('ignores a stored answer it cannot read', async () => {
    await AsyncStorage.setItem(storageKeys.seaNearby, JSON.stringify({ '46.48,30.72': 'yes' }));
    serveTiles(tileWithSeaEastOf(ODESA, 50));
    await expect(isSeaNearby(ODESA)).resolves.toBe(true);
    expect(tileRequests).toBe(1);
  });

  it('starts afresh when the stored answers are not an object', async () => {
    await AsyncStorage.setItem(storageKeys.seaNearby, JSON.stringify(null));
    serveTiles(tileWithSeaEastOf(ODESA, 50));
    await expect(isSeaNearby(ODESA)).resolves.toBe(true);
  });

  it('cannot tell when offline, and asks again next time', async () => {
    server.use(http.get(TILEJSON_URL, () => HttpResponse.error()));
    await expect(isSeaNearby(ODESA)).resolves.toBeUndefined();

    serveTiles(tileWithSeaEastOf(ODESA, 50));
    await expect(isSeaNearby(ODESA)).resolves.toBe(true);
  });

  it('cannot tell when the TileJSON lists no tiles', async () => {
    server.use(http.get(TILEJSON_URL, () => HttpResponse.json({ tiles: [] })));
    await expect(isSeaNearby(ODESA)).resolves.toBeUndefined();
  });

  it('cannot tell when the TileJSON is not TileJSON', async () => {
    server.use(http.get(TILEJSON_URL, () => HttpResponse.json({ version: 3 })));
    await expect(isSeaNearby(ODESA)).resolves.toBeUndefined();
  });
});
