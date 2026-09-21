import { HttpResponse, http } from 'msw';

import { server } from '@tests/msw/server';

import { MIN_QUERY_LENGTH, searchPlaces } from '../geocoding';

const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const varna = {
  id: 726050,
  name: 'Варна',
  latitude: 43.21912,
  longitude: 27.91024,
  country: 'Болгарія',
  admin1: 'Varna',
  feature_code: 'PPLA',
};

const airport = { ...varna, id: 6299310, feature_code: 'AIRP' };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => jest.useRealTimers());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('searchPlaces', () => {
  it('maps a match to a place with its country and region', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ results: [varna] })));
    await expect(searchPlaces('Варна', 'uk')).resolves.toEqual([
      {
        id: '726050',
        name: 'Варна',
        context: 'Болгарія · Varna',
        coordinates: { latitude: 43.21912, longitude: 27.91024 },
      },
    ]);
  });

  it('asks in the interface language', async () => {
    let requested = '';
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requested = new URL(request.url).search;
        return HttpResponse.json({ results: [varna] });
      }),
    );
    await searchPlaces('Varna', 'en');
    expect(requested).toContain('language=en');
    expect(requested).toContain('name=Varna');
  });

  it('drops anything that is not a settlement', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ results: [varna, airport] })));
    const places = await searchPlaces('Варна', 'uk');
    expect(places.map((place) => place.id)).toEqual(['726050']);
  });

  it('returns nothing for a query with no matches', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ generationtime_ms: 0.2 })));
    await expect(searchPlaces('zzzqqq', 'uk')).resolves.toEqual([]);
  });

  it('never asks for a query too short to mean anything', async () => {
    const short = 'a'.repeat(MIN_QUERY_LENGTH - 1);
    await expect(searchPlaces(short, 'uk')).resolves.toEqual([]);
    await expect(searchPlaces('   ', 'uk')).resolves.toEqual([]);
  });

  it('rejects a payload that does not match the schema', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ results: 'nope' })));
    await expect(searchPlaces('Варна', 'uk')).rejects.toMatchObject({ kind: 'validation' });
  });

  it('keeps a result that does not say what kind of place it is', async () => {
    const { feature_code: _ignored, ...unknown } = varna;
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ results: [unknown] })));
    await expect(searchPlaces('Варна', 'uk')).resolves.toHaveLength(1);
  });

  it('omits a missing country or region from the context line', async () => {
    const { country: _c, admin1: _a, ...bare } = varna;
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ results: [bare] })));
    const [place] = await searchPlaces('Варна', 'uk');
    expect(place?.context).toBe('');
  });
});
