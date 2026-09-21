import { onlineManager } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';

import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { MapScreen } from '@/features/map';
import { useLocation, useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
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

const initialSelection = useSelection.getState();
const initialLocation = useLocation.getState();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  useSelection.setState(initialSelection, true);
  useLocation.setState({ ...initialLocation, hydrated: true }, true);
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
});
afterEach(() => {
  onlineManager.setOnline(true);
  server.resetHandlers();
});
afterAll(() => server.close());

describe('settlement search', () => {
  it('finds a town anywhere in the world and forecasts for it', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ results: [varna] })));
    await renderWithProviders(<MapScreen />);

    await fireEvent.changeText(screen.getByLabelText('Пошук населеного пункту'), 'Варна');
    const result = await screen.findByLabelText('Варна, Болгарія · Varna', {}, { timeout: 4000 });
    await fireEvent.press(result);

    const { customPoint, selectedSpotId } = useSelection.getState();
    expect(selectedSpotId).toBe(CUSTOM_SPOT_ID);
    expect(customPoint).toEqual({ latitude: 43.21912, longitude: 27.91024, label: 'Варна' });
  }, 20_000);

  it('says so when nothing matches, rather than showing an empty list', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json({ generationtime_ms: 0.2 })));
    await renderWithProviders(<MapScreen />);

    await fireEvent.changeText(screen.getByLabelText('Пошук населеного пункту'), 'zzzqqq');
    await screen.findByText('Нічого не знайшли. Спробуйте іншу назву.', {}, { timeout: 4000 });
  }, 20_000);

  it('says the search needs a connection instead of searching without one', async () => {
    onlineManager.setOnline(false);
    await renderWithProviders(<MapScreen />);

    await fireEvent.changeText(screen.getByLabelText('Пошук населеного пункту'), 'Варна');
    await screen.findByText(/лише зі зв/, {}, { timeout: 4000 });
  }, 20_000);

  it('does not search for a query too short to mean anything', async () => {
    let calls = 0;
    server.use(
      http.get(SEARCH_URL, () => {
        calls += 1;
        return HttpResponse.json({ results: [varna] });
      }),
    );
    await renderWithProviders(<MapScreen />);

    await fireEvent.changeText(screen.getByLabelText('Пошук населеного пункту'), 'В');
    await waitFor(() => expect(screen.getByLabelText('Мапа водойм')).toBeOnTheScreen());
    expect(calls).toBe(0);
  }, 20_000);
});

describe('naming a picked point', () => {
  it('keeps a name the angler typed when the geocoder answers late', async () => {
    const geocoder = jest.requireMock('expo-location') as { reverseGeocodeAsync: jest.Mock };
    let answer: (value: unknown) => void = () => undefined;
    geocoder.reverseGeocodeAsync.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));

    await renderWithProviders(<MapScreen />);
    await waitFor(() => expect(screen.getByLabelText('Мапа водойм')).toBeOnTheScreen());
    await fireEvent(screen.getByLabelText('Мапа водойм'), 'press', {
      nativeEvent: { lngLat: [27.9, 43.2] },
    });

    await fireEvent.press(await screen.findByRole('button', { name: 'Зберегти' }));
    await fireEvent.changeText(screen.getByLabelText('Назва точки'), 'Наш берег');
    answer([{ city: 'Варна' }]);
    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти й відкрити прогноз' }));
    await waitFor(() => expect(useSelection.getState().customPoint?.label).toBe('Наш берег'));
  }, 20_000);
});

describe('picking a point on the map', () => {
  it('takes a tap as the exact place to forecast for', async () => {
    await renderWithProviders(<MapScreen />);
    await waitFor(() => expect(screen.getByLabelText('Мапа водойм')).toBeOnTheScreen());

    await fireEvent(screen.getByLabelText('Мапа водойм'), 'press', {
      nativeEvent: { lngLat: [27.9, 43.2] },
    });

    const { customPoint, selectedSpotId } = useSelection.getState();
    expect(selectedSpotId).toBe(CUSTOM_SPOT_ID);
    expect(customPoint).toMatchObject({ latitude: 43.2, longitude: 27.9 });
  }, 20_000);

  it('names the tapped point from the nearest settlement', async () => {
    const geocoder = jest.requireMock('expo-location') as { reverseGeocodeAsync: jest.Mock };
    geocoder.reverseGeocodeAsync.mockResolvedValueOnce([{ city: 'Варна' }]);

    await renderWithProviders(<MapScreen />);
    await waitFor(() => expect(screen.getByLabelText('Мапа водойм')).toBeOnTheScreen());
    await fireEvent(screen.getByLabelText('Мапа водойм'), 'press', {
      nativeEvent: { lngLat: [27.9, 43.2] },
    });

    await waitFor(() => expect(useSelection.getState().customPoint?.label).toBe('Варна'));
    await fireEvent.press(screen.getByRole('button', { name: 'Маршрут' }));
    expect(screen.getByText('Як дістатися до «Варна»?')).toBeOnTheScreen();
  }, 20_000);

  it('says a tap drops a pin, until one is down', async () => {
    const hint = 'Тицьніть будь-де на мапі, щоб поставити пін.';
    await renderWithProviders(<MapScreen />);
    await waitFor(() => expect(screen.getByText(hint)).toBeOnTheScreen());

    await fireEvent(screen.getByLabelText('Мапа водойм'), 'press', {
      nativeEvent: { lngLat: [27.9, 43.2] },
    });
    await waitFor(() => expect(screen.queryByText(hint)).toBeNull());
  }, 20_000);

  it('says where an unnamed tap is instead of inventing a place', async () => {
    useSelection.setState({
      selectedSpotId: CUSTOM_SPOT_ID,
      customPoint: { latitude: 43.2, longitude: 27.9, label: '' },
    });
    await renderWithProviders(<MapScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Маршрут' }));
    expect(screen.getByText('Як дістатися до «Точка на мапі»?')).toBeOnTheScreen();
  }, 20_000);
});
