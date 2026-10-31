import { HttpResponse, http } from 'msw';

import { CatchScreen } from '@/features/diary';
import { TodayScreen } from '@/features/today';
import { useDiary, useLocation, usePoints, usePreferences, useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse, tideSeries } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const initialPreferences = usePreferences.getState();
const initialSelection = useSelection.getState();
const initialLocation = useLocation.getState();
const initialPoints = usePoints.getState();

function serve(seaLevel?: number[]): void {
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse(11, seaLevel))),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  usePreferences.setState(
    { ...initialPreferences, hydrated: true, onboardingDone: true, explainerSeen: true },
    true,
  );
  useSelection.setState(initialSelection, true);
  usePoints.setState(initialPoints, true);
  useLocation.setState({ ...initialLocation, hydrated: true }, true);
  useDiary.setState({ catches: [] });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('tomorrow on Today', () => {
  it('shows tomorrow’s bite, air, wind and pressure, and the way to the week', async () => {
    serve();
    await renderWithProviders(<TodayScreen />);

    expect(await screen.findByText(/^Завтра · /, {}, { timeout: 4000 })).toBeOnTheScreen();
    expect(screen.getByText(/, пориви до /)).toBeOnTheScreen();
    expect(screen.getByText(/мм рт\. ст\./)).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Прогноз на весь тиждень' })).toBeOnTheScreen();
  }, 20_000);

  it('lists high and low water where the sea has a real tide', async () => {
    serve(tideSeries(1.6));
    await renderWithProviders(<TodayScreen />);

    expect(await screen.findByText('Припливи', {}, { timeout: 4000 })).toBeOnTheScreen();
    expect(screen.getAllByText(/повна вода/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/мала вода/).length).toBeGreaterThan(0);
  }, 20_000);

  it('says nothing about tides on a sea that barely has one', async () => {
    serve(tideSeries(0.06));
    await renderWithProviders(<TodayScreen />);

    await screen.findByText(/^Завтра · /, {}, { timeout: 4000 });
    expect(screen.queryByText('Припливи')).toBeNull();
  }, 20_000);
});

describe('where a fish was caught', () => {
  it('offers the map, where I am, and the saved places under the name', async () => {
    await renderWithProviders(<CatchScreen />);
    expect(screen.getByRole('button', { name: 'На мапі' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Де я зараз' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Збережені' })).toBeOnTheScreen();
  });

  it('takes a point tapped on the map, and saves it with the entry', async () => {
    await renderWithProviders(<CatchScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'На мапі' }));
    expect(screen.getByText('Де спіймали?')).toBeOnTheScreen();

    await fireEvent(screen.getByLabelText('Мапа водойм'), 'press', {
      nativeEvent: { lngLat: [27.95, 43.2] },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Готово' }));

    expect(screen.getByText('Точка: 43.200, 27.950')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Зберегти' }));
    expect(useDiary.getState().catches[0]?.coordinates).toEqual({
      latitude: 43.2,
      longitude: 27.95,
    });
  });

  it('takes a saved place with its name', async () => {
    usePoints.setState({
      favourites: [{ latitude: 59.5, longitude: 10.6, label: 'Осло-фіорд' }],
    });
    await renderWithProviders(<CatchScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Збережені' }));
    await fireEvent.press(await screen.findByText('Осло-фіорд'));

    expect(screen.getByLabelText('Місце')).toHaveProp('value', 'Осло-фіорд');
    expect(screen.getByText('Точка: 59.500, 10.600')).toBeOnTheScreen();
  });

  it('takes where the angler stands, when the position is known', async () => {
    useLocation.setState({
      status: 'granted',
      origin: { latitude: 50.45, longitude: 30.52 },
      city: 'Київ',
    });
    await renderWithProviders(<CatchScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Де я зараз' }));

    await waitFor(() => expect(screen.getByText('Точка: 50.450, 30.520')).toBeOnTheScreen());
  });

  it('keeps a name the angler typed when the point moves', async () => {
    useLocation.setState({
      status: 'granted',
      origin: { latitude: 50.45, longitude: 30.52 },
      city: 'Київ',
    });
    await renderWithProviders(<CatchScreen />);
    await fireEvent.changeText(screen.getByLabelText('Місце'), 'Наш берег');
    await fireEvent.press(screen.getByRole('button', { name: 'Де я зараз' }));

    await waitFor(() => expect(screen.getByText('Точка: 50.450, 30.520')).toBeOnTheScreen());
    expect(screen.getByLabelText('Місце')).toHaveProp('value', 'Наш берег');
  });
});
