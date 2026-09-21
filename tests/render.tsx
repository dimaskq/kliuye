import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { RenderOptions, RenderResult } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { i18next, initI18n } from '@/i18n';

initI18n('uk');

const clients: QueryClient[] = [];

/** Query retries are off in tests so failures surface on the first attempt. */
export function makeTestQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  clients.push(client);
  return client;
}

/**
 * The app's real `gcTime` is twelve hours, and an armed garbage-collection
 * timer keeps Node's event loop open long after the test has finished.
 */
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

const METRICS = {
  frame: { x: 0, y: 0, width: 412, height: 892 },
  insets: { top: 24, left: 0, right: 0, bottom: 16 },
};

export function withProviders(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return (
      <SafeAreaProvider initialMetrics={METRICS}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  };
}

/** React Native Testing Library 14 renders asynchronously, so this awaits it. */
export async function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions & { queryClient?: QueryClient } = {},
): Promise<RenderResult & { queryClient: QueryClient }> {
  const { queryClient = makeTestQueryClient(), ...rest } = options;
  return { ...(await render(ui, { wrapper: withProviders(queryClient), ...rest })), queryClient };
}

export * from '@testing-library/react-native';
