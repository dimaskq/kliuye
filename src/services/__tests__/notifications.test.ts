import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type * as NotificationsService from '../notifications';

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const FIRE_AT = new Date(2099, 0, 2, 4, 0);

type Service = typeof NotificationsService;

/* The service remembers it has registered its handler; each test starts fresh. */
function freshService(): Service {
  let service: Service | undefined;
  jest.isolateModules(() => {
    service = jest.requireActual<Service>('../notifications');
  });
  return service!;
}

beforeEach(() => jest.clearAllMocks());

describe('ensureNotificationPermission', () => {
  it('does not ask again when the permission is already granted', async () => {
    notifications.getPermissionsAsync.mockResolvedValueOnce({ granted: true } as never);
    await expect(freshService().ensureNotificationPermission()).resolves.toBe(true);
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('asks once and reports a grant', async () => {
    notifications.getPermissionsAsync.mockResolvedValueOnce({ granted: false } as never);
    notifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: true } as never);
    await expect(freshService().ensureNotificationPermission()).resolves.toBe(true);
  });

  it('reports a refusal without throwing', async () => {
    notifications.getPermissionsAsync.mockResolvedValueOnce({ granted: false } as never);
    notifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: false } as never);
    await expect(freshService().ensureNotificationPermission()).resolves.toBe(false);
  });
});

describe('replaceBiteAlerts', () => {
  const alert = { fireAt: FIRE_AT, title: 'Жор', body: 'Вікно 05:00–08:00' };

  it('clears what was pending and schedules each alert on its date', async () => {
    await freshService().replaceBiteAlerts([alert, alert], 'Сповіщення про жор');

    expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'Жор', body: 'Вікно 05:00–08:00', sound: true },
      trigger: { type: 'date', date: FIRE_AT, channelId: 'bite-alerts' },
    });
  });

  it('shows alerts in the foreground, registering the handler once', async () => {
    const service = freshService();
    await service.replaceBiteAlerts([alert], 'Сповіщення про жор');
    await service.replaceBiteAlerts([alert], 'Сповіщення про жор');

    expect(notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    const handler = notifications.setNotificationHandler.mock.calls[0]![0]!;
    await expect(handler.handleNotification({} as never)).resolves.toMatchObject({
      shouldShowBanner: true,
      shouldPlaySound: true,
    });
  });

  it('gives Android its own channel for bite alerts', async () => {
    const os = jest.replaceProperty(Platform, 'OS', 'android');
    await freshService().replaceBiteAlerts([alert], 'Сповіщення про жор');
    os.restore();

    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith('bite-alerts', {
      name: 'Сповіщення про жор',
      importance: 4,
    });
  });
});

describe('cancelBiteAlerts', () => {
  it('takes back everything scheduled', async () => {
    await freshService().cancelBiteAlerts();
    expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });
});

describe('in the browser preview', () => {
  it('schedules and cancels nothing', async () => {
    const os = jest.replaceProperty(Platform, 'OS', 'web');
    const service = freshService();
    await service.replaceBiteAlerts([{ fireAt: FIRE_AT, title: 't', body: 'b' }], 'x');
    await service.cancelBiteAlerts();
    os.restore();

    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });
});
