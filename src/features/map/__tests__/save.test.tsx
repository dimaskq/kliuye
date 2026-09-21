import { HttpResponse, http } from 'msw';

import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { MapScreen } from '@/features/map';
import { includesPoint, useLocation, usePoints, useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const PIN = { latitude: 43.12, longitude: 27.9, label: 'Звездица' };

const initialPoints = usePoints.getState();
const initialSelection = useSelection.getState();
const initialLocation = useLocation.getState();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  usePoints.setState(initialPoints, true);
  useSelection.setState(initialSelection, true);
  useLocation.setState({ ...initialLocation, hydrated: true }, true);
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function pickPin(): void {
  useSelection.setState({ selectedSpotId: CUSTOM_SPOT_ID, customPoint: PIN });
}

describe('saving a picked pin', () => {
  it('offers to save only while a pin is the active point', async () => {
    await renderWithProviders(<MapScreen />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Відкрити' })).toBeOnTheScreen());
    expect(screen.queryByRole('button', { name: 'Зберегти' })).toBeNull();

    pickPin();
    expect(await screen.findByRole('button', { name: 'Зберегти' })).toBeOnTheScreen();
  }, 20_000);

  it('suggests the settlement name and keeps it under the name the angler gives', async () => {
    pickPin();
    await renderWithProviders(<MapScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Зберегти' }));
    const field = screen.getByLabelText('Назва точки');
    expect(field.props.value).toBe('Звездица');

    await fireEvent.changeText(field, 'Скеля біля Звездиці');
    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти й відкрити прогноз' }));

    const saved = { ...PIN, label: 'Скеля біля Звездиці' };
    expect(includesPoint(usePoints.getState().favourites, saved)).toBe(true);
    expect(usePoints.getState().favourites[0]?.label).toBe('Скеля біля Звездиці');
    expect(useSelection.getState().customPoint).toEqual(saved);
  }, 20_000);

  it('falls back to the suggestion when the name is cleared', async () => {
    pickPin();
    await renderWithProviders(<MapScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Зберегти' }));
    await fireEvent.changeText(screen.getByLabelText('Назва точки'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти й відкрити прогноз' }));

    expect(usePoints.getState().favourites[0]?.label).toBe('Звездица');
  }, 20_000);

  it('never unsaves a point that was already kept', () => {
    usePoints.getState().keep(PIN);
    usePoints.getState().keep({ ...PIN, label: 'Нова назва' });
    expect(usePoints.getState().favourites).toEqual([{ ...PIN, label: 'Нова назва' }]);
  });
});

describe('the Find button', () => {
  it('moves the pin to the top match without waiting for the list', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json({
          results: [
            { id: 1, name: 'Варна', latitude: 43.21912, longitude: 27.91024, country: 'Болгарія' },
          ],
        }),
      ),
    );
    await renderWithProviders(<MapScreen />);

    await fireEvent.changeText(screen.getByLabelText('Пошук населеного пункту'), 'Варна');
    await fireEvent.press(screen.getByRole('button', { name: 'Знайти' }));

    await waitFor(() =>
      expect(useSelection.getState().customPoint).toEqual({
        latitude: 43.21912,
        longitude: 27.91024,
        label: 'Варна',
      }),
    );
    expect(useSelection.getState().selectedSpotId).toBe(CUSTOM_SPOT_ID);
  }, 20_000);
});
