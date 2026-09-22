import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { HttpResponse, http } from 'msw';

import { storageKeys } from '@/services/storage';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';

import { BITE_ALERT_TASK, defineBiteAlertTask, refreshBiteAlerts } from '..';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

jest.mock('@/domain/alerts', () => ({
  planBiteAlerts: () => [
    {
      dayOffset: 1,
      fireAt: new Date(2099, 0, 2, 4, 0),
      value: 90,
      verdict: 'feeding',
      startHour: 5,
      endHour: 8,
    },
  ],
}));

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const tasks = (TaskManager as unknown as { __tasks: Map<string, () => Promise<unknown>> }).__tasks;

const TARGET = {
  latitude: 43.21,
  longitude: 27.91,
  shoreBearingDeg: null,
  place: 'Варна',
  species: 'pike',
  language: 'en',
};

let forecastCalls = 0;

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(async () => {
  jest.useRealTimers();
  jest.clearAllMocks();
  forecastCalls = 0;
  await AsyncStorage.clear();
  server.use(
    http.get(FORECAST_URL, () => {
      forecastCalls += 1;
      return HttpResponse.json(makeForecastResponse());
    }),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('refreshBiteAlerts', () => {
  it('fetches a fresh forecast for the saved place and re-plans its alerts', async () => {
    await AsyncStorage.setItem(storageKeys.alertTarget, JSON.stringify(TARGET));

    await expect(refreshBiteAlerts(new Date(2099, 0, 1, 12))).resolves.toBe(true);

    expect(forecastCalls).toBe(1);
    expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    const request = notifications.scheduleNotificationAsync.mock.calls[0]![0];
    expect(request.content.title).toBe('Feeding frenzy at “Варна”! Drop everything');
  }, 20_000);

  it('does nothing while alerts are off, when no place is saved', async () => {
    await expect(refreshBiteAlerts()).resolves.toBe(false);
    expect(forecastCalls).toBe(0);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('ignores a saved place it cannot trust', async () => {
    await AsyncStorage.setItem(
      storageKeys.alertTarget,
      JSON.stringify({ ...TARGET, species: 'shark' }),
    );
    await expect(refreshBiteAlerts()).resolves.toBe(false);
  });
});

describe('the background task', () => {
  it('is defined once and reports how the refresh went', async () => {
    defineBiteAlertTask();
    defineBiteAlertTask();
    expect(TaskManager.defineTask).toHaveBeenCalledTimes(1);

    const run = tasks.get(BITE_ALERT_TASK)!;
    await expect(run()).resolves.toBe(1);

    server.use(http.get(FORECAST_URL, () => new HttpResponse(null, { status: 503 })));
    await AsyncStorage.setItem(storageKeys.alertTarget, JSON.stringify(TARGET));
    await expect(run()).resolves.toBe(2);
  }, 30_000);
});
