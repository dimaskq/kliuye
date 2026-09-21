import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Android groups alerts by channel; the angler can mute this one alone. */
const CHANNEL_ID = 'bite-alerts';

/** The browser preview has no scheduled notifications to manage. */
function isWeb(): boolean {
  return Platform.OS === 'web';
}

/**
 * POST_NOTIFICATIONS is asked for only when the user turns the bite alert on —
 * never at launch (STORE_REVIEW.md §1).
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

let prepared = false;

/** Shows an alert even with the app open, and registers the Android channel. */
async function prepare(channelName: string): Promise<void> {
  if (prepared) return;
  prepared = true;
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: channelName,
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export type ScheduledAlert = {
  fireAt: Date;
  title: string;
  body: string;
};

/**
 * Replaces every pending bite alert with these. The app schedules nothing
 * else, so clearing all of them is clearing ours.
 */
export async function replaceBiteAlerts(
  alerts: readonly ScheduledAlert[],
  channelName: string,
): Promise<void> {
  if (isWeb()) return;
  await prepare(channelName);
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const alert of alerts) {
    await Notifications.scheduleNotificationAsync({
      content: { title: alert.title, body: alert.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: alert.fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}

/** Switching the alert off takes back everything already scheduled. */
export async function cancelBiteAlerts(): Promise<void> {
  if (isWeb()) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
