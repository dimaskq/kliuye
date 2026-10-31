import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

import { SENTRY_DSN } from '@/config/sentry';

/**
 * Crash reports, and nothing else. Off until the angler switches them on in
 * Settings — until then the SDK is never even started — and once on, a report
 * says what broke and where, never who or where they fish.
 */

let running = false;

/** The forecast and tile URLs carry the coordinates in their query. */
export function withoutQuery(url: string): string {
  return url.split('?')[0] ?? url;
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  const url = crumb.data?.['url'];
  if (typeof url !== 'string') return crumb;
  return { ...crumb, data: { ...crumb.data, url: withoutQuery(url) } };
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const { user: _user, ...rest } = event;
  if (rest.request?.url === undefined) return rest;
  return { ...rest, request: { ...rest.request, url: withoutQuery(rest.request.url) } };
}

export function startCrashReports(): void {
  /* A development build would only report our own experiments. */
  if (running || __DEV__) return;
  running = true;
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: false,
    /* Errors only: no tracing, no profiling, no replays, no screenshots. */
    tracesSampleRate: 0,
    enableAutoSessionTracking: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    maxBreadcrumbs: 30,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
  });
}

export function stopCrashReports(): void {
  if (!running) return;
  running = false;
  void Sentry.close();
}

/** For tests: forget whether the SDK was started. */
export function resetCrashReports(): void {
  running = false;
}
