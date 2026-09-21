import { File } from 'expo-file-system';

import {
  TILE_MAX_ZOOM,
  TILE_MIN_ZOOM,
  cacheTiles,
  clearTileCache,
  tileCachePath,
  tileCacheSize,
  tileUrl,
  tileX,
  tileY,
  tilesAround,
} from '../tiles';

const KYIV = { latitude: 50.45, longitude: 30.52 };
const download = File.downloadFileAsync as jest.Mock;

beforeEach(async () => {
  await clearTileCache();
  download.mockClear();
});

describe('tile geometry', () => {
  it('puts the whole world in one tile at zoom 0', () => {
    expect(tileX(30.52, 0)).toBe(0);
    expect(tileY(50.45, 0)).toBe(0);
  });

  it('maps Kyiv to its published slippy-map tile', () => {
    expect({ x: tileX(KYIV.longitude, 13), y: tileY(KYIV.latitude, 13) }).toEqual({
      x: 4790,
      y: 2762,
    });
  });

  it('clamps beyond the edges of the projection rather than overflowing', () => {
    expect(tileY(89, 5)).toBe(0);
    expect(tileY(-89, 5)).toBe(31);
    expect(tileX(-181, 5)).toBe(0);
    expect(tileX(181, 5)).toBe(31);
  });

  it('fills the url template', () => {
    expect(tileUrl({ z: 9, x: 1, y: 2 })).toBe('https://tile.openstreetmap.org/9/1/2.png');
  });
});

describe('tilesAround', () => {
  it('covers every zoom the app draws, coarsest first', () => {
    const tiles = tilesAround(KYIV);
    expect(tiles[0]?.z).toBe(TILE_MIN_ZOOM);
    expect(tiles.at(-1)?.z).toBe(TILE_MAX_ZOOM);
    expect(new Set(tiles.map((tile) => tile.z)).size).toBe(TILE_MAX_ZOOM - TILE_MIN_ZOOM + 1);
  });

  it('includes the point itself at every level', () => {
    const tiles = tilesAround(KYIV);
    for (let z = TILE_MIN_ZOOM; z <= TILE_MAX_ZOOM; z += 1) {
      expect(tiles).toContainEqual({ z, x: tileX(KYIV.longitude, z), y: tileY(KYIV.latitude, z) });
    }
  });

  it('never exceeds the ceiling it is given', () => {
    expect(tilesAround(KYIV, 12, 5)).toHaveLength(5);
  });

  it('widens in longitude towards the poles, where degrees are shorter', () => {
    const north = tilesAround({ latitude: 70, longitude: 30 }, 12);
    const equator = tilesAround({ latitude: 0, longitude: 30 }, 12);
    expect(north.length).toBeGreaterThan(equator.length);
  });
});

describe('the tile cache', () => {
  it('downloads what is missing and counts it', async () => {
    const tiles = tilesAround(KYIV, 12, 8);
    await expect(cacheTiles(tiles)).resolves.toBe(8);
    expect(download).toHaveBeenCalledTimes(8);
  });

  it('never fetches a tile it already has', async () => {
    const tiles = tilesAround(KYIV, 12, 6);
    await cacheTiles(tiles);
    download.mockClear();

    await expect(cacheTiles(tiles)).resolves.toBe(0);
    expect(download).not.toHaveBeenCalled();
  });

  it('reports what it holds, and gives it all back when cleared', async () => {
    await cacheTiles(tilesAround(KYIV, 12, 4));
    await expect(tileCacheSize()).resolves.toBeGreaterThan(0);

    await clearTileCache();
    await expect(tileCacheSize()).resolves.toBe(0);
  });

  it('drops the oldest tiles once the cache outgrows its limit', async () => {
    await cacheTiles(tilesAround(KYIV, 12, 10), undefined, 4 * 1024);
    expect(await tileCacheSize()).toBeLessThanOrEqual(4 * 1024);
  });

  it('treats a failed download as a blank square, not an error', async () => {
    download.mockRejectedValueOnce(new Error('no signal'));
    await expect(cacheTiles(tilesAround(KYIV, 12, 3))).resolves.toBe(2);
  });

  it('stops when the caller aborts', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(cacheTiles(tilesAround(KYIV, 12, 8), controller.signal)).resolves.toBe(0);
  });

  it('hands the map a directory to read tiles from', () => {
    expect(tileCachePath()).toContain('map-tiles');
  });
});
