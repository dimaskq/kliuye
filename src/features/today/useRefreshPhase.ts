import { useCallback, useEffect, useRef, useState } from 'react';

export type RefreshPhase = 'idle' | 'loading' | 'done';

/** A reload that answers in 150 ms would only flash; this long, it reads. */
const MIN_LOADING_MS = 700;
/** How long "updated" stays up before the banner goes. */
const DONE_MS = 1500;

/** Timeouts that all die with the component, or at once on `clear`. */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers;
    return () => pending.current.forEach(clearTimeout);
  }, []);

  const later = useCallback((run: () => void, ms: number) => {
    timers.current.push(setTimeout(run, ms));
  }, []);
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  return { later, clear };
}

/**
 * Turns the query's raw "fetching" flag into something a person can follow:
 * loading lasts long enough to be seen, then says it finished, then leaves.
 * `begin` starts it at the tap, so even an instant answer is seen; background
 * reloads the angler did not ask for show the same way.
 */
function useRefreshPhase(refreshing: boolean) {
  const [phase, setPhase] = useState<RefreshPhase>('idle');
  const startedAt = useRef<number | undefined>(undefined);
  const fetching = useRef(refreshing);
  const { later, clear } = useTimers();

  /* Ends the hold, unless the answer is still on its way; then that ends it. */
  const settle = useCallback(() => {
    if (fetching.current || startedAt.current === undefined) return;
    startedAt.current = undefined;
    setPhase('done');
    later(() => setPhase('idle'), DONE_MS);
  }, [later]);

  const begin = useCallback(() => {
    clear();
    startedAt.current = Date.now();
    setPhase('loading');
    later(settle, MIN_LOADING_MS);
  }, [clear, later, settle]);

  useEffect(() => {
    fetching.current = refreshing;
    const started = startedAt.current;
    if (refreshing && started === undefined) later(begin, 0);
    if (!refreshing && started !== undefined && Date.now() - started >= MIN_LOADING_MS) {
      later(settle, 0);
    }
  }, [begin, later, refreshing, settle]);

  return { phase: refreshing ? 'loading' : phase, begin };
}

/** A reload the angler can see happening: the phase, and the action behind it. */
export function useReload(refreshing: boolean, refetch: () => void) {
  const { phase, begin } = useRefreshPhase(refreshing);
  const reload = useCallback(() => {
    begin();
    refetch();
  }, [begin, refetch]);
  return { phase, reloading: phase === 'loading', reload };
}
