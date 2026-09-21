import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ensureNotificationPermission } from '@/services/notifications';
import { TOGGLE_IDS, usePreferences } from '@/store';
import type { ToggleId } from '@/store';
import type { SettingsRow } from '@/ui';

export type SettingsRows = {
  rows: SettingsRow[];
  onChange: (id: string, value: boolean) => void;
};

/** Switching this on is the only thing that may ask for the notification permission. */
const NEEDS_NOTIFICATION_PERMISSION: ToggleId = 'notifications';

/** The one settings list, shared by the profile tab and the settings screen. */
export function useSettingsRows(): SettingsRows {
  const { t } = useTranslation();
  const toggles = usePreferences((state) => state.toggles);
  const setToggle = usePreferences((state) => state.setToggle);

  const onChange = useCallback(
    (id: string, value: boolean) => {
      const toggleId = id as ToggleId;
      if (toggleId !== NEEDS_NOTIFICATION_PERMISSION || !value) {
        setToggle(toggleId, value);
        return;
      }
      /* The switch stays off unless the user actually grants the permission. */
      void ensureNotificationPermission().then((granted) => setToggle(toggleId, granted));
    },
    [setToggle],
  );

  return {
    rows: TOGGLE_IDS.map((id) => ({
      id,
      label: t(`settings.${id}`),
      hint: t(`settings.${id}Hint`),
      value: toggles[id],
    })),
    onChange,
  };
}
