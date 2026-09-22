import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentForecast, useSpotLabel } from '@/hooks';
import type { Language } from '@/i18n';
import { cancelBiteAlerts, replaceBiteAlerts } from '@/services/notifications';
import { usePreferences, useSelection } from '@/store';

import { alertsFor } from './alertMessages';
import { clearAlertTarget, saveAlertTarget } from './alertTarget';
import type { AlertTarget } from './alertTarget';
import { syncBackgroundRefresh } from './backgroundRefresh';

/** Where and for what alerts are planned right now, for the background refresh. */
function useAlertTarget(): AlertTarget {
  const { spot } = useCurrentForecast();
  const place = useSpotLabel()(spot).name;
  const species = useSelection((state) => state.speciesId);
  const language = usePreferences((state) => state.language) as Language;
  return {
    latitude: spot.coordinates.latitude,
    longitude: spot.coordinates.longitude,
    shoreBearingDeg: spot.shoreBearingDeg ?? null,
    place,
    species,
    language,
  };
}

async function applyAlerts(enabled: boolean, signature: string, channel: string) {
  const { alerts, target } = JSON.parse(signature) as {
    alerts: { fireAt: string; title: string; body: string }[];
    target: AlertTarget;
  };
  if (!enabled) {
    await Promise.all([cancelBiteAlerts(), clearAlertTarget(), syncBackgroundRefresh(false)]);
    return;
  }
  await replaceBiteAlerts(
    alerts.map((alert) => ({ ...alert, fireAt: new Date(alert.fireAt) })),
    channel,
  );
  await Promise.all([saveAlertTarget(target), syncBackgroundRefresh(true)]);
}

/**
 * Keeps the scheduled bite alerts in step with the forecast: a new forecast,
 * another place or another language re-plans them; the switch going off
 * cancels them. While on, a background task refreshes them between visits.
 * Alerts are local, so nothing about the angler leaves the phone.
 */
export function useBiteAlerts(): void {
  const { t } = useTranslation();
  const enabled = usePreferences((state) => state.toggles.notifications);
  const { model } = useCurrentForecast();
  const target = useAlertTarget();

  const alerts = useMemo(
    () => (model === undefined ? [] : alertsFor(model.week, target.place, t, new Date())),
    [model, target.place, t],
  );

  /* Scheduling is keyed on what would actually be sent, not on object identity. */
  const signature = JSON.stringify({ alerts, target });
  const channel = t('notifications.channel');

  useEffect(() => {
    /* A failed schedule must never break the screen that happens to be open. */
    applyAlerts(enabled, signature, channel).catch(() => undefined);
  }, [channel, enabled, signature]);
}
