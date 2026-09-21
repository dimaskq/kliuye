import * as Notifications from 'expo-notifications';
import { HttpResponse, http } from 'msw';

import { usePreferences, useSelection } from '@/store';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';
import { makeTestQueryClient, renderHook, waitFor, withProviders } from '@tests/render';

import { useBiteAlerts } from '../useBiteAlerts';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const mockFireAt = new Date(2099, 0, 2, 4, 0);

jest.mock('@/domain/alerts', () => ({
  planBiteAlerts: () => [
    { dayOffset: 1, fireAt: mockFireAt, value: 88, verdict: 'feeding', startHour: 5, endHour: 8 },
  ],
}));

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const initialPreferences = usePreferences.getState();
const initialSelection = useSelection.getState();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  usePreferences.setState(initialPreferences, true);
  useSelection.setState(initialSelection, true);
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
  );
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderAlerts() {
  return renderHook(() => useBiteAlerts(), { wrapper: withProviders(makeTestQueryClient()) });
}

describe('useBiteAlerts', () => {
  it('schedules a loud alert for a good day once the switch is on', async () => {
    usePreferences.setState({ toggles: { offlineMaps: true, notifications: true } });
    await renderAlerts();

    await waitFor(() => expect(notifications.scheduleNotificationAsync).toHaveBeenCalled());
    const request = notifications.scheduleNotificationAsync.mock.calls[0]![0];
    expect(request.content.title).toBe('Жор на «Затока за дамбою»! Кидай усе й їдь');
    expect(request.content.body).toContain('05:00–08:00');
    expect(request.trigger).toMatchObject({ type: 'date', date: mockFireAt });
  }, 20_000);

  it('takes every alert back when the switch is off', async () => {
    await renderAlerts();

    await waitFor(() =>
      expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled(),
    );
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  }, 20_000);
});
