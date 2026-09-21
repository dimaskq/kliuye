/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories must use require. */
import '@testing-library/react-native/matchers';

/** Reanimated ships a Jest stub; without it every animated component throws. */
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/** Notifications are never granted by default: the switch must ask, not assume. */
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

/** Location is never granted by default: the app must work without it. */
jest.mock('expo-location', () => ({
  Accuracy: { Low: 1 },
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  getLastKnownPositionAsync: jest.fn(() => Promise.resolve(null)),
  getCurrentPositionAsync: jest.fn(() => Promise.reject(new Error('no fix'))),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([])),
}));

/** Screens are tested on their own, so navigation is a spy rather than a router. */
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
    dismissTo: jest.fn(),
  }),
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

/**
 * MapLibre needs its native module. The double keeps the imperative camera
 * surface the component actually uses, so a missing method still fails a test.
 */
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');

  /* One stable set of spies, so a test can assert how the camera moved. */
  const commands = {
    easeTo: jest.fn(),
    flyTo: jest.fn(),
    jumpTo: jest.fn(),
    fitBounds: jest.fn(),
    zoomTo: jest.fn(),
  };

  function Camera({ ref }: { ref?: unknown }): null {
    React.useImperativeHandle(ref, () => commands);
    return null;
  }

  const passThrough = (props: Record<string, unknown>) => React.createElement(View, props);

  return {
    __esModule: true,
    Map: passThrough,
    Camera,
    Marker: passThrough,
    ViewAnnotation: passThrough,
    __commands: commands,
  };
});

/** Connected by default: offline is the exception a test opts into. */
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-font', () => ({
  useFonts: (): [boolean, null] => [true, null],
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: () => true,
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'uk', languageTag: 'uk-UA', regionCode: 'UA' }],
}));

/** Time and randomness are pinned so every run sees the same forecast. */
beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2025-04-12T05:41:00.000Z') });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

/**
 * React Native's Jest environment installs interval-based polyfills that keep
 * the worker alive; clearing them after every file lets Jest exit on its own.
 */
afterAll(() => {
  jest.useRealTimers();
});

/**
 * The journal's media. The doubles keep real semantics — a copy lands in the
 * app's own directory, a delete removes it — so the service is exercised, not
 * skipped, and a picker that returns nothing still has to be handled.
 */
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));

jest.mock('expo-video-thumbnails', () => ({
  getThumbnailAsync: jest.fn(async () => ({ uri: 'file:///cache/frame.jpg', width: 1, height: 1 })),
}));

jest.mock('expo-file-system', () => {
  /** uri -> file, which is all the app's use of the filesystem needs. */
  const entries = new Map<string, { size: number; modificationTime: number }>();
  let clock = 0;

  const clean = (part: unknown): string =>
    (typeof part === 'string' ? part : String(part)).replace(/\/+$/, '');
  const join = (parts: unknown[]): string => parts.map(clean).join('/');
  const childrenOf = (uri: string): string[] =>
    [...entries.keys()].filter((entry) => entry.startsWith(`${uri}/`));

  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    create(): void {}
    get exists(): boolean {
      return childrenOf(this.uri).length > 0;
    }
    list(): unknown[] {
      const found = new Map<string, unknown>();
      for (const child of childrenOf(this.uri)) {
        const [head, ...rest] = child.slice(this.uri.length + 1).split('/');
        const name = head ?? '';
        found.set(
          name,
          rest.length === 0 ? new File(this.uri, name) : new Directory(this.uri, name),
        );
      }
      return [...found.values()];
    }
    delete(): void {
      for (const child of childrenOf(this.uri)) entries.delete(child);
    }
    toString(): string {
      return this.uri;
    }
  }

  class File {
    uri: string;
    static downloadFileAsync = jest.fn((_url: string, destination: { uri: string }) => {
      clock += 1;
      entries.set(destination.uri, { size: 1024, modificationTime: clock });
      return Promise.resolve(destination);
    });
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists(): boolean {
      return entries.has(this.uri);
    }
    get size(): number | null {
      return entries.get(this.uri)?.size ?? null;
    }
    info(): { modificationTime: number } {
      return { modificationTime: entries.get(this.uri)?.modificationTime ?? 0 };
    }
    copy(destination: { uri: string }): Promise<void> {
      clock += 1;
      entries.set(destination.uri, { size: 1024, modificationTime: clock });
      return Promise.resolve();
    }
    delete(): void {
      entries.delete(this.uri);
    }
    toString(): string {
      return this.uri;
    }
  }

  return { Directory, File, Paths: { document: 'file:///documents/' } };
});
