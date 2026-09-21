import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';

import { changeLanguage, i18next, initI18n } from '@/i18n';
import { startNetworkWatch } from '@/services/network';
import { createPersister, createQueryClient, persistOptions } from '@/services/query';
import { migrateStorage } from '@/services/storage';
import { usePreferences } from '@/store';

initI18n();

/**
 * Query cache, connectivity, i18n and storage migration — everything the tree
 * needs to exist. The cache is restored from disk before the first render that
 * can fetch, which is what makes a cold start with no signal show a forecast.
 */
export function AppProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  const language = usePreferences((state) => state.language);
  const queryClient = useMemo(() => createQueryClient(), []);
  const persister = useMemo(() => createPersister(), []);

  useEffect(() => {
    void migrateStorage();
    startNetworkWatch();
  }, []);

  useEffect(() => {
    void changeLanguage(language);
  }, [language]);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions(persister)}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </PersistQueryClientProvider>
  );
}
