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

/** How a successful response is read, and what it asks the server for. */
type Body<T> = {
  accept: string;
  read: (response: Response) => Promise<T>;
};

const JSON_BODY: Body<unknown> = {
  accept: 'application/json',
  read: async (response) => (await response.json()) as unknown,
};

const BYTES_BODY: Body<Uint8Array> = {
  accept: 'application/x-protobuf, application/octet-stream',
  read: async (response) => new Uint8Array(await response.arrayBuffer()),
};

/** @throws AppError — every failure leaves this function already normalised. */
async function requestOnce<T>(url: string, options: RequestOptions, body: Body<T>): Promise<T> {
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
      headers: { Accept: body.accept },
    });
    if (!response.ok) {
      throw new AppError('http', `Request failed with status ${response.status}`, response.status);
    }
    return await body.read(response);
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
async function request<T>(url: string, options: RequestOptions, body: Body<T>): Promise<T> {
  let lastError = new AppError('network', 'Network request failed');

  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await requestOnce(url, options, body);
    } catch (error) {
      lastError = toAppError(error);
      if (!isRetriable(lastError) || attempt === RETRY_ATTEMPTS) break;
      await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError;
}

export function getJson(url: string, options: RequestOptions = {}): Promise<unknown> {
  return request(url, options, JSON_BODY);
}

/** Raw bytes, for the binary map tiles the coast check reads. */
export function getBytes(url: string, options: RequestOptions = {}): Promise<Uint8Array> {
  return request(url, options, BYTES_BODY);
}
