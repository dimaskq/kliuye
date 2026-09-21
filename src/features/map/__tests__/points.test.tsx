import { HttpResponse, http } from 'msw';

import { pointKey } from '@/domain/geo';
import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { MapScreen } from '@/features/map';
import { RECENT_LIMIT, includesPoint, useLocation, usePoints, useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const VARNA = { latitude: 43.21, longitude: 27.91, label: 'Варна' };
const KYIV = { latitude: 50.45, longitude: 30.52, label: 'Київ' };

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

describe('remembering points', () => {
  it('keeps the most recent first', () => {
    usePoints.getState().remember(VARNA);
    usePoints.getState().remember(KYIV);
    expect(usePoints.getState().recent.map((point) => point.label)).toEqual(['Київ', 'Варна']);
  });

  it('treats one place picked twice as one entry, keeping the newer name', () => {
    usePoints.getState().remember({ ...VARNA, label: '' });
    usePoints.getState().remember(VARNA);
    expect(usePoints.getState().recent).toHaveLength(1);
    expect(usePoints.getState().recent[0]?.label).toBe('Варна');
  });

  it(`never grows past ${RECENT_LIMIT} entries`, () => {
    for (let index = 0; index < RECENT_LIMIT + 5; index += 1) {
      usePoints.getState().remember({ latitude: 40 + index, longitude: 20, label: `p${index}` });
    }
    expect(usePoints.getState().recent).toHaveLength(RECENT_LIMIT);
    expect(usePoints.getState().recent[0]?.label).toBe(`p${RECENT_LIMIT + 4}`);
  });
});

describe('favourites', () => {
  it('adds and removes the same point', () => {
    usePoints.getState().toggleFavourite(VARNA);
    expect(includesPoint(usePoints.getState().favourites, VARNA)).toBe(true);

    usePoints.getState().toggleFavourite({ ...VARNA, label: 'інша назва' });
    expect(usePoints.getState().favourites).toHaveLength(0);
  });

  it('matches a point by place, not by exact coordinates', () => {
    usePoints.getState().toggleFavourite(VARNA);
    expect(includesPoint(usePoints.getState().favourites, { ...VARNA, latitude: 43.2149 })).toBe(
      true,
    );
  });
});

describe('my places', () => {
  async function openPlaces(): Promise<void> {
    await renderWithProviders(<MapScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Мої місця' }));
  }

  it('opens from the header on the saved places', async () => {
    await openPlaces();
    expect(screen.getByRole('tab', { name: 'Збережені' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Недавні' })).toBeOnTheScreen();
    expect(screen.getByText('Нічого не збережено')).toBeOnTheScreen();
  }, 20_000);

  it('says how to get a recent point when there are none yet', async () => {
    await openPlaces();
    await fireEvent.press(screen.getByRole('tab', { name: 'Недавні' }));
    expect(screen.getByText('Ще немає недавніх точок')).toBeOnTheScreen();
  }, 20_000);

  it('lists remembered points and lets one be chosen', async () => {
    usePoints.setState({ recent: [VARNA, KYIV] });
    await openPlaces();

    await fireEvent.press(screen.getByRole('tab', { name: 'Недавні' }));
    await fireEvent.press(screen.getByText('Варна'));

    expect(useSelection.getState().selectedSpotId).toBe(CUSTOM_SPOT_ID);
    expect(pointKey(useSelection.getState().customPoint!)).toBe(pointKey(VARNA));
    await waitFor(() => expect(screen.queryByText('Київ')).toBeNull());
  }, 20_000);

  it('keeps a point from the recent list and shows it under saved', async () => {
    usePoints.setState({ recent: [VARNA] });
    await openPlaces();

    await fireEvent.press(screen.getByRole('tab', { name: 'Недавні' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти точку' }));
    expect(includesPoint(usePoints.getState().favourites, VARNA)).toBe(true);

    await fireEvent.press(screen.getByRole('tab', { name: 'Збережені' }));
    expect(screen.getByText('Варна')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Прибрати зі збережених' })).toBeOnTheScreen();
  }, 20_000);
});
