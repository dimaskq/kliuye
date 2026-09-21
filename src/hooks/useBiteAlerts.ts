import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { planBiteAlerts } from '@/domain/alerts';
import { cancelBiteAlerts, replaceBiteAlerts } from '@/services/notifications';
import type { ScheduledAlert } from '@/services/notifications';
import { usePreferences } from '@/store';
import { formatHour } from '@/utils/format';

import { useCurrentForecast } from './useCurrentForecast';
import { useSpotLabel } from './useSpotLabel';

/**
 * Keeps the scheduled bite alerts in step with the forecast: a new forecast,
 * another place or another language re-plans them; the switch going off
 * cancels them. Alerts are local, so nothing about the angler leaves the phone.
 */
export function useBiteAlerts(): void {
  const { t } = useTranslation();
  const enabled = usePreferences((state) => state.toggles.notifications);
  const { model, spot } = useCurrentForecast();
  const place = useSpotLabel()(spot).name;

  const alerts = useMemo<ScheduledAlert[]>(() => {
    if (model === undefined) return [];
    return planBiteAlerts(model.week, new Date()).map((alert) => ({
      fireAt: alert.fireAt,
      title: t(`notifications.title.${alert.verdict}`, { place }),
      body: t('notifications.body', {
        start: formatHour(alert.startHour),
        end: formatHour(alert.endHour),
        value: alert.value,
      }),
    }));
  }, [model, place, t]);

  /* Scheduling is keyed on what would actually be sent, not on object identity. */
  const signature = JSON.stringify(alerts);
  const channelName = t('notifications.channel');

  useEffect(() => {
    const planned = JSON.parse(signature) as { fireAt: string; title: string; body: string }[];
    const work = enabled
      ? replaceBiteAlerts(
          planned.map((alert) => ({ ...alert, fireAt: new Date(alert.fireAt) })),
          channelName,
        )
      : cancelBiteAlerts();
    /* A failed schedule must never break the screen that happens to be open. */
    work.catch(() => undefined);
  }, [channelName, enabled, signature]);
}
