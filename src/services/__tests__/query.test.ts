import type { Query } from '@tanstack/react-query';

import {
  FORECAST_CACHE_TIME_MS,
  FORECAST_STALE_TIME_MS,
  createPersister,
  createQueryClient,
  forecastQueryKey,
  persistOptions,
} from '../query';

describe('query client', () => {
  it('keeps the forecast fresh for 30 minutes and cached for a week offline', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.staleTime).toBe(FORECAST_STALE_TIME_MS);
    expect(defaults?.gcTime).toBe(FORECAST_CACHE_TIME_MS);
    expect(FORECAST_STALE_TIME_MS).toBe(30 * 60 * 1000);
    expect(FORECAST_CACHE_TIME_MS).toBe(7 * 24 * 60 * 60 * 1000);
    client.clear();
  });

  it('prefers the cache to an empty screen when offline', () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.networkMode).toBe('offlineFirst');
    client.clear();
  });

  it('writes settled answers to disk and nothing else', () => {
    const options = persistOptions(createPersister());
    const dehydrate = options.dehydrateOptions.shouldDehydrateQuery;

    expect(options.maxAge).toBe(FORECAST_CACHE_TIME_MS);
    expect(options.buster).toBe('v1');
    expect(dehydrate({ state: { status: 'success' } } as Query)).toBe(true);
    expect(dehydrate({ state: { status: 'error' } } as Query)).toBe(false);
    expect(dehydrate({ state: { status: 'pending' } } as Query)).toBe(false);
  });

  it('builds a persister backed by AsyncStorage', () => {
    const persister = createPersister();
    expect(typeof persister.persistClient).toBe('function');
    expect(typeof persister.restoreClient).toBe('function');
  });

  it('keys the forecast by spot and position so each water caches on its own', () => {
    expect(forecastQueryKey('s2', { latitude: 50.71, longitude: 30.53 })).toEqual([
      'forecast',
      's2',
      '50.71',
      '30.53',
    ]);
  });
});

describe('forecastQueryKey', () => {
  const KYIV = { latitude: 50.62, longitude: 30.48 };
  const VARNA = { latitude: 43.21, longitude: 27.91 };

  it('separates two waters', () => {
    expect(forecastQueryKey('s2', KYIV)).not.toEqual(forecastQueryKey('s3', KYIV));
  });

  it('separates one moving point from where it used to be', () => {
    /* A picked point keeps its id while it moves; only the coordinates change. */
    expect(forecastQueryKey('custom', KYIV)).not.toEqual(forecastQueryKey('custom', VARNA));
  });

  it('keys by the same rounding the request carries, so a nudge is not a refetch', () => {
    expect(forecastQueryKey('custom', { latitude: 50.6234, longitude: 30.4812 })).toEqual(
      forecastQueryKey('custom', { latitude: 50.6187, longitude: 30.4759 }),
    );
  });
});
