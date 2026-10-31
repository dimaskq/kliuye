import { HttpResponse, http } from 'msw';

import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { HowItWorksScreen } from '@/features/about';
import { OnboardingTour } from '@/features/onboarding';
import { TodayScreen } from '@/features/today';
import { WeekScreen } from '@/features/week';
import { AppProviders } from '@/providers/AppProviders';
import { waterNearby } from '@/services/coast';
import { resetCrashReports } from '@/services/crashReports';
import { useLocation, usePreferences, useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const initialPreferences = usePreferences.getState();
const initialSelection = useSelection.getState();
const initialLocation = useLocation.getState();
const waterCheck = jest.mocked(waterNearby);
const FRESH = { water: true, fresh: true };
const LAND = { water: false, fresh: false };
const SEA = { water: true, fresh: false };
/* Off the Varna beach. */
const OFFSHORE = { latitude: 43.26, longitude: 28.04, label: '' };
/* Somewhere in the Sahara. */
const DESERT = { latitude: 23.4, longitude: 12.8, label: '' };

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  usePreferences.setState({ ...initialPreferences, hydrated: true, onboardingDone: true }, true);
  useSelection.setState(initialSelection, true);
  useLocation.setState({ ...initialLocation, hydrated: true }, true);
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
});
afterEach(() => {
  server.resetHandlers();
  waterCheck.mockReset();
  waterCheck.mockResolvedValue(FRESH);
});
afterAll(() => server.close());

function pinInTheDesert(): void {
  waterCheck.mockResolvedValue(LAND);
  useSelection.setState({ selectedSpotId: CUSTOM_SPOT_ID, customPoint: DESERT });
}

describe('no index on land', () => {
  it('shows no number for a point on land, only the way back to the water', async () => {
    pinInTheDesert();
    await renderWithProviders(<TodayScreen />);

    expect(await screen.findByText('Тут немає водойми')).toBeOnTheScreen();
    expect(screen.queryByText('Індекс кльову')).toBeNull();
    expect(screen.getByRole('button', { name: 'Обрати воду на мапі' })).toBeOnTheScreen();
  }, 20_000);

  it('asks with a tight reach for a picked point', async () => {
    pinInTheDesert();
    await renderWithProviders(<TodayScreen />);
    await screen.findByText('Тут немає водойми');

    expect(waterCheck).toHaveBeenCalledWith(
      { latitude: DESERT.latitude, longitude: DESERT.longitude },
      0.3,
      expect.anything(),
    );
  }, 20_000);

  it('keeps the week empty on land too', async () => {
    pinInTheDesert();
    await renderWithProviders(<WeekScreen />);
    expect(await screen.findByText('Тут немає водойми')).toBeOnTheScreen();
  }, 20_000);

  it('shows the forecast when the check cannot tell, rather than hiding it on a guess', async () => {
    waterCheck.mockResolvedValue(undefined);
    useSelection.setState({ selectedSpotId: CUSTOM_SPOT_ID, customPoint: DESERT });
    await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());
  }, 20_000);

  it('never checks the bundled waters', async () => {
    await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());
    expect(waterCheck).not.toHaveBeenCalled();
  }, 20_000);
});

describe('fresh water and the sea', () => {
  it('rules a carp out at sea and says why, rather than promising a bite', async () => {
    waterCheck.mockResolvedValue(SEA);
    useSelection.setState({
      selectedSpotId: CUSTOM_SPOT_ID,
      customPoint: OFFSHORE,
      speciesId: 'carp',
    });
    await renderWithProviders(<TodayScreen />);

    expect(
      await screen.findByText(
        'Прісної води тут немає — ця риба в морі не водиться.',
        {},
        { timeout: 4000 },
      ),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Індекс кльову 0 зі 100/)).toBeOnTheScreen();
  }, 20_000);

  it('rules cod out off Varna: it does not live in the Black Sea', async () => {
    waterCheck.mockResolvedValue(SEA);
    useSelection.setState({
      selectedSpotId: CUSTOM_SPOT_ID,
      customPoint: OFFSHORE,
      speciesId: 'cod',
    });
    await renderWithProviders(<TodayScreen />);

    expect(
      await screen.findByText('У цьому морі ця риба не водиться.', {}, { timeout: 4000 }),
    ).toBeOnTheScreen();
  }, 20_000);

  it('still scores a carp on a lake', async () => {
    useSelection.setState({
      selectedSpotId: CUSTOM_SPOT_ID,
      customPoint: DESERT,
      speciesId: 'carp',
    });
    await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());
    expect(screen.queryByText(/Прісної води тут немає/)).toBeNull();
  }, 20_000);
});

describe('explaining the number', () => {
  it('says next to the species that the index is about weather, not about this water', async () => {
    await renderWithProviders(<TodayScreen />);
    expect(
      await screen.findByText(/а не наявність риби в цій водоймі/, {}, { timeout: 4000 }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Як ми рахуємо?' })).toBeOnTheScreen();
  }, 20_000);

  it('lists the eight factors with the weights the model uses, heaviest first', async () => {
    await renderWithProviders(<HowItWorksScreen />);
    const factors = screen.getAllByLabelText(/^.+, \d+%\./);
    expect(factors).toHaveLength(8);
    expect(factors[0]).toHaveProp(
      'accessibilityLabel',
      expect.stringMatching(/^Атмосферний тиск.*22%/),
    );
    expect(screen.getByText('Чого індекс не знає')).toBeOnTheScreen();
  });
});

describe('where the number comes from', () => {
  it('explains the index right under it on the first visit, with the real weights', async () => {
    usePreferences.setState({ explainerSeen: false });
    await renderWithProviders(<TodayScreen />);

    expect(await screen.findByText('Звідки це число?', {}, { timeout: 4000 })).toBeOnTheScreen();
    expect(screen.getByLabelText('Тиск, 22%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Вода, 18%')).toBeOnTheScreen();
  }, 20_000);

  it('goes away for good once it is read', async () => {
    usePreferences.setState({ explainerSeen: false });
    await renderWithProviders(<TodayScreen />);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Зрозуміло' }, { timeout: 4000 }),
    );

    expect(screen.queryByText('Звідки це число?')).toBeNull();
    expect(usePreferences.getState().explainerSeen).toBe(true);
  }, 20_000);

  it('counts opening the full explanation as reading it', async () => {
    usePreferences.setState({ explainerSeen: false });
    await renderWithProviders(<TodayScreen />);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Як ми рахуємо' }, { timeout: 4000 }),
    );
    expect(usePreferences.getState().explainerSeen).toBe(true);
  }, 20_000);

  it('shows the factor weights in the tour, on the step about the index', async () => {
    usePreferences.setState({ onboardingDone: false });
    await renderWithProviders(<OnboardingTour />);
    expect(screen.queryByLabelText('Тиск, 22%')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Далі' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Далі' }));

    expect(screen.getByText('Звідки береться індекс')).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/^.+, \d+%$/)).toHaveLength(8);
  });
});

describe('first-launch tour', () => {
  it('walks through four steps and is not shown again', async () => {
    usePreferences.setState({ onboardingDone: false });
    await renderWithProviders(<OnboardingTour />);

    expect(screen.getByText('Крок 1 з 4')).toBeOnTheScreen();
    for (let step = 0; step < 3; step += 1) {
      await fireEvent.press(screen.getByRole('button', { name: 'Далі' }));
    }
    expect(screen.getByText('Крок 4 з 4')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Пропустити' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Почати' }));
    expect(usePreferences.getState().onboardingDone).toBe(true);
  });

  it('can be skipped from the first screen', async () => {
    usePreferences.setState({ onboardingDone: false });
    await renderWithProviders(<OnboardingTour />);
    await fireEvent.press(screen.getByRole('button', { name: 'Пропустити' }));
    expect(usePreferences.getState().onboardingDone).toBe(true);
  });

  it('holds the location dialog back until the tour is over', async () => {
    usePreferences.setState({ onboardingDone: false });
    const view = await renderWithProviders(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Індекс кльову')).toBeOnTheScreen());
    expect(screen.queryByText('Дозволити геопозицію')).toBeNull();

    usePreferences.setState({ onboardingDone: true });
    await view.rerender(<TodayScreen />);
    expect(await screen.findByText('Дозволити геопозицію')).toBeOnTheScreen();
  }, 20_000);
});

describe('crash reports and consent', () => {
  it('starts the SDK only after the switch is turned on, and stops it when it is off', async () => {
    const sentry = jest.requireMock<{ init: jest.Mock; close: jest.Mock }>('@sentry/react-native');
    const runtime = globalThis as unknown as { __DEV__: boolean };
    const dev = runtime.__DEV__;
    runtime.__DEV__ = false;
    resetCrashReports();
    sentry.init.mockClear();

    await renderWithProviders(
      <AppProviders>
        <></>
      </AppProviders>,
    );
    expect(sentry.init).not.toHaveBeenCalled();

    await act(async () => usePreferences.getState().setToggle('crashReports', true));
    expect(sentry.init).toHaveBeenCalledTimes(1);

    await act(async () => usePreferences.getState().setToggle('crashReports', false));
    expect(sentry.close).toHaveBeenCalled();
    runtime.__DEV__ = dev;
  });
});
