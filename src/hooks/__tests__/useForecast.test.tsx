import { onlineManager } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';

import { DEFAULT_SPOT } from '@/domain/spots';
import type { Spot } from '@/domain/spots';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { makeTestQueryClient, renderHook, waitFor, withProviders } from '@tests/render';

import { useForecast } from '../useForecast';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => jest.useRealTimers());
afterEach(() => {
  onlineManager.setOnline(true);
  server.resetHandlers();
});
afterAll(() => server.close());

function renderForecast() {
  return renderHook(() => useForecast(DEFAULT_SPOT), {
    wrapper: withProviders(makeTestQueryClient()),
  });
}

describe('useForecast', () => {
  it('starts in a loading state and then resolves', async () => {
    server.use(
      http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
      http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
    );

    const { result } = await renderForecast();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.forecast?.days).toHaveLength(7);
    expect(result.current.error).toBeUndefined();
    expect(result.current.isStale).toBe(false);
  });

  it('surfaces the failure without data when the service is down', async () => {
    server.use(
      http.get(FORECAST_URL, () => new HttpResponse(null, { status: 500 })),
      http.get(MARINE_URL, () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = await renderForecast();
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.forecast).toBeUndefined();
    expect(result.current.isStale).toBe(false);
  }, 20_000);

  it('keeps showing the cached forecast, marked stale, when a refetch fails', async () => {
    server.use(
      http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
      http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
    );
    const queryClient = makeTestQueryClient();
    const { result } = await renderHook(() => useForecast(DEFAULT_SPOT), {
      wrapper: withProviders(queryClient),
    });
    await waitFor(() => expect(result.current.forecast).toBeDefined());

    server.use(http.get(FORECAST_URL, () => new HttpResponse(null, { status: 503 })));
    result.current.refetch();

    await waitFor(() => expect(result.current.isStale).toBe(true));
    expect(result.current.forecast?.days).toHaveLength(7);
  }, 20_000);

  it('marks the cached forecast stale as soon as the signal goes, before any refetch', async () => {
    server.use(
      http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
      http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
    );

    const { result, rerender } = await renderForecast();
    await waitFor(() => expect(result.current.forecast).toBeDefined());
    expect(result.current.isStale).toBe(false);

    onlineManager.setOnline(false);
    await rerender(undefined);

    expect(result.current.isStale).toBe(true);
    expect(result.current.forecast?.days).toHaveLength(7);
  }, 20_000);
});

describe('a moving point', () => {
  it('fetches again once it has moved, instead of reusing the old forecast', async () => {
    const requested: string[] = [];
    server.use(
      http.get(FORECAST_URL, ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('latitude') ?? '');
        return HttpResponse.json(makeForecastResponse());
      }),
      http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
    );

    const queryClient = makeTestQueryClient();
    const kyiv = { ...DEFAULT_SPOT, id: 'custom' };
    const varna = { ...kyiv, coordinates: { latitude: 43.21, longitude: 27.91 } };

    const { result, rerender } = await renderHook((spot: Spot) => useForecast(spot), {
      wrapper: withProviders(queryClient),
      initialProps: kyiv,
    });
    await waitFor(() => expect(result.current.forecast).toBeDefined());

    await rerender(varna);
    await waitFor(() => expect(requested).toHaveLength(2));
    expect(requested).toEqual(['50.62', '43.21']);
  }, 20_000);
});
