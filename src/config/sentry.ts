/**
 * Where crash reports go: Sentry, EU region. Public by design — it only lets
 * the app send events, never read them — so it lives in the code, unlike the
 * upload token in `secrets/`.
 */
export const SENTRY_DSN =
  'https://06f9933fd4a4931b5960246502efc80a@o4512346354417664.ingest.de.sentry.io/4512346362740816';
