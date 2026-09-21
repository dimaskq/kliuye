import { HttpResponse, http } from 'msw';

import { server } from '@tests/msw/server';

import { AppError, errorMessageKey, isOfflineError, toAppError } from '../errors';
import { getJson } from '../http';

const URL = 'https://example.test/data';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
/** The retry backoff and the timeout are real waits, so this file opts out of fake timers. */
beforeEach(() => jest.useRealTimers());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getJson', () => {
  it('returns the parsed body on success', async () => {
    server.use(http.get(URL, () => HttpResponse.json({ ok: true })));
    await expect(getJson(URL)).resolves.toEqual({ ok: true });
  });

  it('retries once on a server error and succeeds', async () => {
    let calls = 0;
    server.use(
      http.get(URL, () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json({ ok: true });
      }),
    );
    await expect(getJson(URL)).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('does not retry a client error', async () => {
    let calls = 0;
    server.use(
      http.get(URL, () => {
        calls += 1;
        return new HttpResponse(null, { status: 404 });
      }),
    );
    await expect(getJson(URL)).rejects.toMatchObject({ kind: 'http', status: 404 });
    expect(calls).toBe(1);
  });

  it('surfaces a transport failure as a network error', async () => {
    server.use(http.get(URL, () => HttpResponse.error()));
    await expect(getJson(URL)).rejects.toMatchObject({ kind: 'network' });
  });

  it('aborts a request already in flight when the caller cancels', async () => {
    server.use(
      http.get(URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ ok: true });
      }),
    );
    const controller = new AbortController();
    const pending = getJson(URL, { signal: controller.signal });
    setTimeout(() => controller.abort(), 10);
    await expect(pending).rejects.toMatchObject({ kind: 'aborted' });
  });

  it('aborts when the caller cancels', async () => {
    server.use(http.get(URL, () => HttpResponse.json({ ok: true })));
    const controller = new AbortController();
    controller.abort();
    await expect(getJson(URL, { signal: controller.signal })).rejects.toBeInstanceOf(AppError);
  });

  it('gives up after the timeout', async () => {
    server.use(
      http.get(URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(getJson(URL, { timeoutMs: 1 })).rejects.toMatchObject({ kind: 'timeout' });
  });
});

describe('error helpers', () => {
  it('recognises the offline kinds', () => {
    expect(isOfflineError(new AppError('network', 'x'))).toBe(true);
    expect(isOfflineError(new AppError('timeout', 'x'))).toBe(true);
    expect(isOfflineError(new AppError('http', 'x', 500))).toBe(false);
    expect(isOfflineError(new Error('x'))).toBe(false);
  });

  it('maps an error to an i18n key', () => {
    expect(errorMessageKey(new AppError('validation', 'x'))).toBe('error.validation');
    expect(errorMessageKey(new Error('x'))).toBe('error.unknown');
  });

  it('defaults the status to zero for non-HTTP failures', () => {
    expect(new AppError('network', 'x').status).toBe(0);
    expect(new AppError('http', 'x', 503).status).toBe(503);
  });
});

describe('toAppError', () => {
  it('passes an AppError through unchanged', () => {
    const original = new AppError('validation', 'bad shape');
    expect(toAppError(original)).toBe(original);
  });

  it('reports a timeout when the deadline fired', () => {
    expect(toAppError(new Error('aborted'), true)).toMatchObject({ kind: 'timeout' });
  });

  it('recognises an abort by name', () => {
    const abort = new Error('cancelled');
    abort.name = 'AbortError';
    expect(toAppError(abort)).toMatchObject({ kind: 'aborted' });
  });

  it('falls back to a network error, even for a non-Error throw', () => {
    expect(toAppError(new Error('socket hang up'))).toMatchObject({
      kind: 'network',
      message: 'socket hang up',
    });
    expect(toAppError('boom')).toMatchObject({
      kind: 'network',
      message: 'Network request failed',
    });
  });
});
