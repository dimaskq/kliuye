/* eslint-disable @typescript-eslint/no-require-imports -- a cache read at first use can only be re-run with a fresh registry. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { describePlace, reverseGeocode } from '../places';
import type * as PlacesModule from '../places';
import { storageKeys } from '../storage';
import type * as StorageModule from '../storage';

const mocked = Location as jest.Mocked<typeof Location>;
const VARNA = { latitude: 43.21, longitude: 27.91 };
const NOWHERE = { latitude: 12.34, longitude: 56.78 };

/**
 * The names on disk are read once per process, so a new session means a new
 * module registry — and with it a new storage double to seed.
 */
async function nextSession(stored: unknown) {
  jest.resetModules();
  /* The package's own Jest double is a plain object, not an ES default export. */
  const storage = require('@react-native-async-storage/async-storage') as typeof AsyncStorage;
  const { storageKeys: keys } = require('../storage') as typeof StorageModule;
  await storage.setItem(keys.places, JSON.stringify(stored));

  const location = jest.mocked(require('expo-location') as typeof Location);
  location.reverseGeocodeAsync.mockRejectedValue(new Error('no connection'));
  return require('../places') as typeof PlacesModule;
}

describe('describePlace', () => {
  it('gives the settlement, and the region it lies in', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([
      { city: 'Вишгород', subregion: 'Вишгородський район', region: 'Київська область' },
    ] as never);
    await expect(describePlace({ latitude: 50.58, longitude: 30.49 })).resolves.toEqual({
      name: 'Вишгород',
      area: 'Київська область',
    });
  });

  it('names a place with no settlement by its district, over the region', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([
      { subregion: 'Вишгородський район', region: 'Київська область' },
    ] as never);
    await expect(describePlace({ latitude: 50.7, longitude: 30.4 })).resolves.toEqual({
      name: 'Вишгородський район',
      area: 'Київська область',
    });
  });

  it('reads the region it kept, and skips anything malformed on disk', async () => {
    const places = await nextSession([
      ['43.21,27.91', { name: 'Варна', area: 'Варненська область' }],
      ['1.00,1.00', 42],
      ['bad'],
      'not an entry',
      [7, 'Варна'],
    ]);
    await expect(places.describePlace(VARNA)).resolves.toEqual({
      name: 'Варна',
      area: 'Варненська область',
    });
    await expect(places.describePlace({ latitude: 1, longitude: 1 })).resolves.toEqual({});
  });

  it('starts afresh when the stored names are not a list', async () => {
    const places = await nextSession({ broken: true });
    await expect(places.describePlace(VARNA)).resolves.toEqual({});
  });

  it('reads names an earlier version kept as plain strings', async () => {
    const places = await nextSession([['43.21,27.91', 'Варна']]);
    await expect(places.describePlace(VARNA)).resolves.toEqual({ name: 'Варна' });
  });
});

describe('reverseGeocode', () => {
  it('answers with the settlement the geocoder found', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([{ city: 'Варна' }] as never);
    await expect(reverseGeocode(VARNA)).resolves.toBe('Варна');
  });

  it('keeps the name on disk, so the same place is still named offline', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([{ city: 'Варна' }] as never);
    await reverseGeocode(VARNA);

    const stored = await AsyncStorage.getItem(storageKeys.places);
    expect(stored).toContain('Варна');

    mocked.reverseGeocodeAsync.mockRejectedValue(new Error('no connection'));
    await expect(reverseGeocode(VARNA)).resolves.toBe('Варна');
  });

  it('falls back through the coarser fields the geocoder offers', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([{ region: 'Одеська область' }] as never);
    await expect(reverseGeocode({ latitude: 46.48, longitude: 30.73 })).resolves.toBe(
      'Одеська область',
    );
  });

  it('has nothing to say about a place it has never named', async () => {
    mocked.reverseGeocodeAsync.mockRejectedValue(new Error('not supported on web'));
    await expect(reverseGeocode(NOWHERE)).resolves.toBeUndefined();
  });

  it('treats an empty answer as no name rather than an error', async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([] as never);
    await expect(reverseGeocode({ latitude: 1.11, longitude: 2.22 })).resolves.toBeUndefined();
  });
});

describe('names kept between sessions', () => {
  it('still labels a point the geocoder cannot reach this time', async () => {
    const places = await nextSession([['43.21,27.91', 'Варна']]);
    await expect(places.reverseGeocode(VARNA)).resolves.toBe('Варна');
  });

  it('ignores a cache written by something else', async () => {
    const places = await nextSession({ '43.21,27.91': 'Варна' });
    await expect(places.reverseGeocode(VARNA)).resolves.toBeUndefined();
  });

  it('skips entries that are not a coordinate and a name', async () => {
    const places = await nextSession([['43.21,27.91'], [1, 2], ['12.34,56.78', 'Ніде']]);
    await expect(places.reverseGeocode(VARNA)).resolves.toBeUndefined();
    await expect(places.reverseGeocode(NOWHERE)).resolves.toBe('Ніде');
  });
});
