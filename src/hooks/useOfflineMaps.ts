import { useCallback, useEffect, useRef, useState } from 'react';

import { pointKey } from '@/domain/geo';
import type { LatLng } from '@/domain/geo';
import { cacheTiles, clearTileCache, tileCacheSize, tilesAround } from '@/services/tiles';
import { usePreferences } from '@/store';

import { useIsOnline } from './useIsOnline';

/** Long enough that dragging the pin across the map does not fetch every stop. */
const PREFETCH_DELAY_MS = 2000;
/** The selected point plus a handful of kept ones; the rest can wait for a visit. */
const MAX_AREAS = 6;

/** Areas fetched already — kept for the session, not for the life of the app. */
const seen = new Set<string>();

async function prefetch(
  points: readonly LatLng[],
  done: Set<string>,
  signal: AbortSignal,
): Promise<void> {
  for (const point of points.slice(0, MAX_AREAS)) {
    const key = pointKey(point);
    if (signal.aborted) return;
    if (done.has(key)) continue;
    done.add(key);
    await cacheTiles(tilesAround(point), signal);
  }
}

/**
 * Keeps the map around the given points on disk while there is a connection, so
 * the same places still draw when there is none. Each area is fetched once per
 * session; already-stored tiles are skipped without a request.
 */
export function useTilePrefetch(points: readonly LatLng[]): void {
  const online = useIsOnline();
  const enabled = usePreferences((state) => state.toggles.offlineMaps);
  const latest = useRef(points);
  /* Coordinates round to the same key as everywhere else, so a nudge of the pin
     is not a new area. */
  const areas = points.map(pointKey).join('|');

  useEffect(() => {
    latest.current = points;
  }, [points]);

  useEffect(() => {
    if (!online || !enabled || areas === '') return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void prefetch(latest.current, seen, controller.signal);
    }, PREFETCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [areas, enabled, online]);
}

export type TileCache = {
  bytes: number;
  busy: boolean;
  clear: () => void;
};

/** What the settings screen shows: how much the offline map costs, and a way out. */
export function useTileCache(): TileCache {
  const [state, setState] = useState({ bytes: 0, busy: true });

  const measure = useCallback(() => {
    void tileCacheSize().then((bytes) => setState({ bytes, busy: false }));
  }, []);

  useEffect(() => {
    measure();
  }, [measure]);

  const clear = useCallback(() => {
    setState((current) => ({ ...current, busy: true }));
    seen.clear();
    void clearTileCache().then(measure);
  }, [measure]);

  return { ...state, clear };
}
