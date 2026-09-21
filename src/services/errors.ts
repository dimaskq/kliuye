/** Typed failures, so screens can tell "no network" from "bad response". */
export type AppErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'validation';

export class AppError extends Error {
  readonly kind: AppErrorKind;
  /** HTTP status for `http` failures; 0 for everything else. */
  readonly status: number;

  constructor(kind: AppErrorKind, message: string, status = 0) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = status;
  }
}

/** Normalises anything thrown by `fetch` into one of our kinds. */
export function toAppError(error: unknown, timedOut = false): AppError {
  if (error instanceof AppError) return error;
  if (timedOut) return new AppError('timeout', 'The request timed out');
  if (error instanceof Error && error.name === 'AbortError') {
    return new AppError('aborted', 'Request was cancelled');
  }
  return new AppError('network', error instanceof Error ? error.message : 'Network request failed');
}

export function isOfflineError(error: unknown): boolean {
  return error instanceof AppError && (error.kind === 'network' || error.kind === 'timeout');
}

/** i18n key describing the failure to the user. */
export function errorMessageKey(error: unknown): string {
  return error instanceof AppError ? `error.${error.kind}` : 'error.unknown';
}
