import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { changeLanguage, i18next, initI18n } from '@/i18n';
import { startCrashReports, stopCrashReports } from '@/services/crashReports';
import { startNetworkWatch } from '@/services/network';
import { createPersister, createQueryClient, persistOptions } from '@/services/query';
import { migrateStorage } from '@/services/storage';
import { usePreferences } from '@/store';
import { THEMES, ThemeProvider } from '@/ui';
import type { ColorScheme } from '@/ui';

initI18n();

/**
 * The theme in use: the one picked in Settings, or the phone's. A picked one is
 * also handed to the system, so its own dialogs and pickers match.
 */
function useScheme(): ColorScheme {
  const mode = usePreferences((state) => state.themeMode);
  const system = useColorScheme();
  const scheme: ColorScheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  }, [mode]);

  /* The window behind the app: no white flash under the keyboard or a modal at night. */
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(THEMES[scheme].bg);
  }, [scheme]);

  return scheme;
}

/**
 * Query cache, connectivity, i18n and storage migration — everything the tree
 * needs to exist. The cache is restored from disk before the first render that
 * can fetch, which is what makes a cold start with no signal show a forecast.
 */
export function AppProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  const language = usePreferences((state) => state.language);
  const crashReports = usePreferences((state) => state.toggles.crashReports);
  const scheme = useScheme();
  const queryClient = useMemo(() => createQueryClient(), []);
  const persister = useMemo(() => createPersister(), []);

  useEffect(() => {
    void migrateStorage();
    startNetworkWatch();
  }, []);

  useEffect(() => {
    void changeLanguage(language);
  }, [language]);

  /* Started only by the switch in Settings, and stopped the moment it is off. */
  useEffect(() => {
    if (crashReports) startCrashReports();
    else stopCrashReports();
  }, [crashReports]);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions(persister)}>
      <I18nextProvider i18n={i18next}>
        <ThemeProvider scheme={scheme}>{children}</ThemeProvider>
      </I18nextProvider>
    </PersistQueryClientProvider>
  );
}
