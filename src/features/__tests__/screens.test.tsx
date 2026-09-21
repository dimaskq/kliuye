import { HttpResponse, http } from 'msw';

import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { AboutScreen, LicensesScreen } from '@/features/about';
import { MapScreen } from '@/features/map';
import { ProfileScreen } from '@/features/profile';
import { SettingsScreen } from '@/features/settings';
import { TipsScreen } from '@/features/tips';
import { TodayScreen } from '@/features/today';
import { WeekScreen } from '@/features/week';
import { useLocation, usePoints, usePreferences, useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const initialPreferences = usePreferences.getState();
const initialSelection = useSelection.getState();
const initialLocation = useLocation.getState();
const initialPoints = usePoints.getState();
const VARNA = { latitude: 43.21, longitude: 27.91 };

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  usePreferences.setState(initialPreferences, true);
  useSelection.setState(initialSelection, true);
  usePoints.setState(initialPoints, true);
  useLocation.setState({ ...initialLocation, hydrated: true }, true);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function serveForecast(): void {
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
}

function serveFailure(): void {
  server.use(
    http.get(FORECAST_URL, () => new HttpResponse(null, { status: 503 })),
    http.get(MARINE_URL, () => new HttpResponse(null, { status: 503 })),
  );
}

describe('TodayScreen', () => {
  it('shows the index, the eight factors and a tip once the forecast lands', async () => {
    serveForecast();
    await renderWithProviders(<TodayScreen />);

    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());
    expect(screen.getByText('З чого складається')).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/^Вітер:|^Тиск:|^Вода:|^Сонце:/).length).toBeGreaterThan(0);
    expect(screen.getByText('Порада на зараз')).toBeOnTheScreen();
    expect(screen.getByText('Затока за дамбою')).toBeOnTheScreen();
  }, 20_000);

  it('switching species re-derives the index', async () => {
    serveForecast();
    await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Вид риби')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText(/^Щука, індекс/));
    expect(useSelection.getState().speciesId).toBe('pike');
  }, 20_000);

  it('offers a retry, not a blank screen, when the service is down', async () => {
    serveFailure();
    await renderWithProviders(<TodayScreen />);

    await waitFor(() => expect(screen.getByText('Не вдалося оновити прогноз')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'Спробувати ще' })).toBeOnTheScreen();
  }, 20_000);
});

describe('TodayScreen header', () => {
  it('asks for a fresh forecast from the refresh button', async () => {
    let calls = 0;
    server.use(
      http.get(FORECAST_URL, () => {
        calls += 1;
        return HttpResponse.json(makeForecastResponse());
      }),
      http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
    );
    await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());
    const before = calls;

    await fireEvent.press(screen.getByRole('button', { name: 'Оновити прогноз' }));
    await waitFor(() => expect(calls).toBeGreaterThan(before));
  }, 20_000);

  it('shows that the forecast is reloading, then that it is done', async () => {
    serveForecast();
    await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole('button', { name: 'Оновити прогноз' }));
    expect(await screen.findByText('Оновлюємо прогноз…')).toBeOnTheScreen();
    expect(await screen.findByText('Прогноз оновлено', {}, { timeout: 3000 })).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByText('Прогноз оновлено')).toBeNull(), {
      timeout: 3000,
    });
  }, 20_000);

  it('switches to a saved place from the list', async () => {
    const saved = { latitude: 43.21, longitude: 27.91, label: 'Скеля біля Варни' };
    usePoints.setState({ favourites: [saved] });
    serveForecast();
    await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole('button', { name: 'Мої місця' }));
    await fireEvent.press(screen.getByText('Скеля біля Варни'));

    expect(useSelection.getState().selectedSpotId).toBe(CUSTOM_SPOT_ID);
    expect(useSelection.getState().customPoint).toEqual(saved);
    await waitFor(() => expect(screen.getAllByText('Скеля біля Варни').length).toBeGreaterThan(0));
  }, 20_000);
});

describe('TodayScreen and location', () => {
  it('offers the permission behind an explanation, never a bare system prompt', async () => {
    serveForecast();
    await renderWithProviders(<TodayScreen />);

    await waitFor(() => expect(screen.getByText('Показати водойми поруч')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'Дозволити' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Обрати водойму вручну' })).toBeOnTheScreen();
  }, 20_000);

  it('forecasts for the device position, wherever that is', async () => {
    useLocation.setState({ status: 'granted', origin: VARNA, city: 'Варна', hydrated: true });
    serveForecast();
    await renderWithProviders(<TodayScreen />);

    await waitFor(() => expect(screen.getByText('Ваше місце')).toBeOnTheScreen());
    expect(screen.getByText(/^Варна · /)).toBeOnTheScreen();
    expect(screen.queryByText('Показати водойми поруч')).toBeNull();
  }, 20_000);

  it('says where you are by coordinates rather than naming the wrong town', async () => {
    useLocation.setState({ status: 'granted', origin: VARNA, hydrated: true });
    serveForecast();
    await renderWithProviders(<TodayScreen />);

    await waitFor(() => expect(screen.getByText('Ваше місце')).toBeOnTheScreen());
    expect(screen.getByText(/^43\.210, 27\.910 · /)).toBeOnTheScreen();
    /* The forecast timezone is Europe/Kyiv; it must never be read as a place. */
    expect(screen.queryByText(/Kyiv · /)).toBeNull();
  }, 20_000);

  it('opens the map from the header, so the place can always be changed', async () => {
    serveForecast();
    await renderWithProviders(<TodayScreen />);

    await waitFor(() => expect(screen.getByText('Затока за дамбою')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'Затока за дамбою' })).toHaveAccessibleName(
      'Затока за дамбою',
    );
  }, 20_000);

  it('stops offering the permission once a water was chosen by hand', async () => {
    useSelection.setState({ selectedSpotId: 's3' });
    serveForecast();
    await renderWithProviders(<TodayScreen />);

    await waitFor(() => expect(screen.getByText('Старе русло')).toBeOnTheScreen());
    expect(screen.queryByText('Показати водойми поруч')).toBeNull();
    expect(screen.getByText(/^Вишгород · /)).toBeOnTheScreen();
  }, 20_000);
});

describe('WeekScreen', () => {
  it('lists seven days and expands one on tap', async () => {
    serveForecast();
    await renderWithProviders(<WeekScreen />);

    await waitFor(() => expect(screen.getByText('Тиждень')).toBeOnTheScreen());
    const days = screen.getAllByLabelText(/індекс \d+/);
    expect(days).toHaveLength(7);

    await fireEvent.press(days[2]!);
    expect(useSelection.getState().selectedDayIndex).toBe(2);
    expect(
      screen.getByText('Тицьніть день, щоб побачити вікно кльову, вітер, тиск і фазу місяця.'),
    ).toBeOnTheScreen();
  }, 20_000);

  it('shows the failure state with a retry', async () => {
    serveFailure();
    await renderWithProviders(<WeekScreen />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Спробувати ще' })).toBeOnTheScreen(),
    );
  }, 20_000);
});

describe('TipsScreen', () => {
  it('lists advice derived from the current weather', async () => {
    serveForecast();
    await renderWithProviders(<TipsScreen />);

    await waitFor(() => expect(screen.getByText('Поради')).toBeOnTheScreen());
    expect(screen.getByText('Із того, що зараз коїться з погодою')).toBeOnTheScreen();
    expect(screen.getAllByRole('header').length).toBeGreaterThan(1);
  }, 20_000);

  it('shows the failure state with a retry', async () => {
    serveFailure();
    await renderWithProviders(<TipsScreen />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Спробувати ще' })).toBeOnTheScreen(),
    );
  }, 20_000);
});

describe('MapScreen', () => {
  it('works with location never granted, starting from the catalogue water', async () => {
    serveForecast();
    await renderWithProviders(<MapScreen />);

    await waitFor(() => expect(screen.getByText('Де будемо рибачити?')).toBeOnTheScreen());
    await fireEvent.press(screen.getByRole('button', { name: 'Маршрут' }));
    expect(screen.getByText('Як дістатися до «Затока за дамбою»?')).toBeOnTheScreen();
  }, 20_000);

  it('forecasts for the device position far from the catalogue, with no route to it', async () => {
    useLocation.setState({ status: 'granted', origin: VARNA, city: 'Варна', hydrated: true });
    serveForecast();
    await renderWithProviders(<MapScreen />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Відкрити' })).toBeOnTheScreen());
    expect(screen.queryByRole('button', { name: 'Маршрут' })).toBeNull();
  }, 20_000);
});

describe('ProfileScreen', () => {
  it('shows local stats, settings, language and a Pro block with no purchase', async () => {
    serveForecast();
    await renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText('Клює Про')).toBeOnTheScreen());
    expect(screen.getByText('Скоро')).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Сповіщення про жор' })).not.toBeChecked();
    expect(screen.getByText('Точок')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Про застосунок' })).toBeOnTheScreen();
  }, 20_000);

  it('switches the interface language', async () => {
    serveForecast();
    await renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'English' })).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
    expect(usePreferences.getState().language).toBe('en');
  }, 20_000);

  it('offers all three languages, each named in itself', async () => {
    serveForecast();
    await renderWithProviders(<ProfileScreen />);

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Українська' })).toBeOnTheScreen(),
    );
    expect(screen.getByRole('radio', { name: 'English' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Български' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  }, 20_000);

  it('switches to Bulgarian', async () => {
    serveForecast();
    await renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Български' })).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole('radio', { name: 'Български' }));
    expect(usePreferences.getState().language).toBe('bg');
  }, 20_000);
});

describe('SettingsScreen', () => {
  it('turns a switch off', async () => {
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('switch', { name: 'Мапа офлайн' }));
    expect(usePreferences.getState().toggles.offlineMaps).toBe(false);
  });

  it('offers only switches that do something', async () => {
    await renderWithProviders(<SettingsScreen />);
    expect(screen.getAllByRole('switch')).toHaveLength(2);
  });
});

describe('AboutScreen', () => {
  it('carries the disclaimer, the data attribution and the privacy statement', async () => {
    await renderWithProviders(<AboutScreen />);
    expect(screen.getByText(/оцінка на основі відкритих погодних даних/)).toBeOnTheScreen();
    expect(
      screen.getByText(/^Погодні дані та пошук населених пунктів: Open-Meteo/),
    ).toBeOnTheScreen();
    expect(screen.getAllByText(/OpenStreetMap/)).toHaveLength(2);
    expect(screen.getByText(/Правила, заборонені періоди/)).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Політика приватності' })).toBeOnTheScreen();
    expect(screen.getByText('https://dimaskq.github.io/kliuye/privacy/')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Написати розробнику' })).toBeOnTheScreen();
  });

  it('lists generated open-source licences', async () => {
    await renderWithProviders(<LicensesScreen />);
    expect(screen.getByText('expo')).toBeOnTheScreen();
    expect(screen.getByText('Rubik')).toBeOnTheScreen();
  });
});

describe('notification permission', () => {
  it('leaves the bite alert off when the permission is refused', async () => {
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('switch', { name: 'Сповіщення про жор' }));
    await waitFor(() => expect(usePreferences.getState().toggles.notifications).toBe(false));
  });

  it('turns the bite alert on once the permission is granted', async () => {
    const notifications = jest.requireMock('expo-notifications') as {
      requestPermissionsAsync: jest.Mock;
    };
    notifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: true });

    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('switch', { name: 'Сповіщення про жор' }));
    await waitFor(() => expect(usePreferences.getState().toggles.notifications).toBe(true));
  });
});
