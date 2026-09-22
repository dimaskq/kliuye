import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { weeklyScores } from '@/hooks/useBiteModel';
import { translatorFor } from '@/i18n';
import { replaceBiteAlerts } from '@/services/notifications';
import { fetchForecast } from '@/services/weather';

import { alertsFor } from './alertMessages';
import { readAlertTarget } from './alertTarget';

export const BITE_ALERT_TASK = 'kliuye.bite-alert-refresh';

/**
 * Nine hours: fresh enough that an alert rests on this morning's or tonight's
 * forecast, rare enough to cost nothing noticeable in battery or data. The
 * system treats it as a minimum and picks the actual moment itself.
 */
export const REFRESH_INTERVAL_MINUTES = 9 * 60;

/** Fetches the latest forecast for the saved place and re-plans its alerts. */
export async function refreshBiteAlerts(now: Date = new Date()): Promise<boolean> {
  const target = await readAlertTarget();
  if (target === undefined) return false;

  const forecast = await fetchForecast(target, now);
  const week = weeklyScores(
    forecast,
    { shoreBearingDeg: target.shoreBearingDeg ?? undefined },
    target.species,
  );
  if (week === undefined) return false;

  const t = translatorFor(target.language);
  await replaceBiteAlerts(alertsFor(week, target.place, t, now), t('notifications.channel'));
  return true;
}

/**
 * Must run at start-up, before any screen: Android wakes the app without UI to
 * run the task, and only a task defined at that point can be found.
 */
export function defineBiteAlertTask(): void {
  if (Platform.OS === 'web' || TaskManager.isTaskDefined(BITE_ALERT_TASK)) return;
  TaskManager.defineTask(BITE_ALERT_TASK, async () => {
    try {
      await refreshBiteAlerts();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Starts or stops the periodic refresh together with the alert switch. */
export async function syncBackgroundRefresh(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  const registered = await TaskManager.isTaskRegisteredAsync(BITE_ALERT_TASK);
  if (enabled && !registered) {
    await BackgroundTask.registerTaskAsync(BITE_ALERT_TASK, {
      minimumInterval: REFRESH_INTERVAL_MINUTES,
    });
  }
  if (!enabled && registered) await BackgroundTask.unregisterTaskAsync(BITE_ALERT_TASK);
}
