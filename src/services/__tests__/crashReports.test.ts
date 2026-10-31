import * as Sentry from '@sentry/react-native';

import {
  resetCrashReports,
  scrubBreadcrumb,
  scrubEvent,
  startCrashReports,
  stopCrashReports,
  withoutQuery,
} from '../crashReports';

const sdk = jest.mocked(Sentry);
const runtime = globalThis as unknown as { __DEV__: boolean };
const DEV = runtime.__DEV__;

beforeEach(() => {
  resetCrashReports();
  sdk.init.mockClear();
  sdk.close.mockClear();
  runtime.__DEV__ = false;
});
afterAll(() => {
  runtime.__DEV__ = DEV;
});

describe('starting and stopping', () => {
  it('starts the SDK once, with no personal data and errors only', () => {
    startCrashReports();
    startCrashReports();
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(sdk.init).toHaveBeenCalledWith(
      expect.objectContaining({
        sendDefaultPii: false,
        tracesSampleRate: 0,
        attachScreenshot: false,
        attachViewHierarchy: false,
      }),
    );
  });

  it('sends to the EU region', () => {
    startCrashReports();
    expect(sdk.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: expect.stringContaining('.ingest.de.sentry.io/') }),
    );
  });

  it('stops when the switch goes off, and only if it was running', () => {
    stopCrashReports();
    expect(sdk.close).not.toHaveBeenCalled();
    startCrashReports();
    stopCrashReports();
    expect(sdk.close).toHaveBeenCalledTimes(1);
  });

  it('never reports from a development build', () => {
    runtime.__DEV__ = true;
    startCrashReports();
    expect(sdk.init).not.toHaveBeenCalled();
  });
});

describe('what a report may carry', () => {
  const FORECAST =
    'https://api.open-meteo.com/v1/forecast?latitude=43.21&longitude=27.91&hourly=wind';

  it('cuts the coordinates out of every URL', () => {
    expect(withoutQuery(FORECAST)).toBe('https://api.open-meteo.com/v1/forecast');
    expect(scrubBreadcrumb({ category: 'fetch', data: { url: FORECAST } }).data?.['url']).toBe(
      'https://api.open-meteo.com/v1/forecast',
    );
  });

  it('leaves a breadcrumb with no URL alone', () => {
    const crumb = { category: 'navigation', data: { to: '/diary' } };
    expect(scrubBreadcrumb(crumb)).toBe(crumb);
  });

  it('drops the user and the query from an event', () => {
    const event = scrubEvent({
      type: undefined,
      user: { ip_address: '1.2.3.4' },
      request: { url: FORECAST },
    });
    expect(event.user).toBeUndefined();
    expect(event.request?.url).toBe('https://api.open-meteo.com/v1/forecast');
  });

  it('passes an event with no request through, minus the user', () => {
    expect(scrubEvent({ type: undefined, user: { id: 'x' }, message: 'boom' })).toEqual({
      type: undefined,
      message: 'boom',
    });
  });
});
