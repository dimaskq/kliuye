import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpResponse, http } from 'msw';

import { TILEJSON_URL, resetSeaNearbyCache } from '@/services/coast';
import { storageKeys } from '@/services/storage';
import { encodeTile, square } from '@tests/factories/mvt';

import { server } from './server';

const TILES = 'https://tiles.example.test/planet';

/**
 * Handlers for the coast check: every tile is all sea or all land, so a screen
 * test can put its spot on the coast or far inland without real map data. Any
 * answer an earlier test left behind, in memory or on disk, is forgotten first.
 */
export async function serveCoast(seaNearby: boolean): Promise<void> {
  resetSeaNearbyCache();
  await AsyncStorage.removeItem(storageKeys.seaNearby);
  const tile = encodeTile([
    {
      name: 'water',
      features: seaNearby
        ? [{ properties: { class: 'ocean' }, rings: [square(-64, -64, 4224)] }]
        : [],
    },
  ]);
  server.use(
    http.get(TILEJSON_URL, () => HttpResponse.json({ tiles: [`${TILES}/{z}/{x}/{y}.pbf`] })),
    http.get(`${TILES}/:z/:x/:y`, () => HttpResponse.arrayBuffer(tile.slice().buffer)),
  );
}
