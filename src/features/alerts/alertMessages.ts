import type { TFunction } from 'i18next';

import { planBiteAlerts } from '@/domain/alerts';
import type { DailyBiteScore } from '@/domain/bite-index';
import type { ScheduledAlert } from '@/services/notifications';
import { formatHour } from '@/utils/format';

/**
 * The alerts to schedule for a forecast week, worded for the angler. Shared by
 * the screen that is open and the background refresh, so both say the same.
 */
export function alertsFor(
  week: readonly DailyBiteScore[],
  place: string,
  t: TFunction,
  now: Date,
): ScheduledAlert[] {
  return planBiteAlerts(week, now).map((alert) => ({
    fireAt: alert.fireAt,
    title: t(`notifications.title.${alert.verdict}`, { place }),
    body: t('notifications.body', {
      start: formatHour(alert.startHour),
      end: formatHour(alert.endHour),
      value: alert.value,
    }),
  }));
}
