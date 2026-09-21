import { AppError, toAppError } from './errors';

const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_ATTEMPTS = 1;
const RETRY_BASE_DELAY_MS = 400;
const RETRIABLE_STATUS_FROM = 500;

export type RequestOptions = {
  signal?: AbortSignal | undefined;
  timeoutMs?: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** @throws AppError — every failure leaves this function already normalised. */
async function requestOnce(url: string, options: RequestOptions): Promise<unknown> {
  if (options.signal?.aborted === true) throw new AppError('aborted', 'Request was cancelled');

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const cancel = (): void => controller.abort();
  options.signal?.addEventListener('abort', cancel);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new AppError('http', `Request failed with status ${response.status}`, response.status);
    }
    return (await response.json()) as unknown;
  } catch (error) {
    throw toAppError(error, timedOut);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancel);
  }
}

function isRetriable(error: AppError): boolean {
  if (error.kind === 'aborted') return false;
  if (error.kind === 'http') return error.status >= RETRIABLE_STATUS_FROM;
  return true;
}

/**
 * The one HTTP entry point: bounded timeout, a single backed-off retry, and
 * typed errors. Nothing else in the app calls `fetch`.
 */
export async function getJson(url: string, options: RequestOptions = {}): Promise<unknown> {
  let lastError = new AppError('network', 'Network request failed');

  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await requestOnce(url, options);
    } catch (error) {
      lastError = toAppError(error);
      if (!isRetriable(lastError) || attempt === RETRY_ATTEMPTS) break;
      await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError;
}
