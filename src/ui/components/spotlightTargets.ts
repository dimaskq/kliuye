import { useSyncExternalStore } from 'react';

/** Anything that can say where it is on screen — a native view, or a test double. */
export type Measurable = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

export type TargetRect = { x: number; y: number; width: number; height: number };

/*
 * The parts of the screen a spotlight tour can point at, by id. Kept outside
 * React state: a target registering itself must not re-render the screen it
 * sits on, only the tour that waits for it.
 */
const targets = new Map<string, Measurable>();
const listeners = new Set<() => void>();
let version = 0;

function notify(): void {
  version += 1;
  for (const listener of listeners) listener();
}

export function registerTarget(id: string, view: Measurable | null): void {
  if (view === null) {
    if (targets.delete(id)) notify();
    return;
  }
  if (targets.get(id) === view) return;
  targets.set(id, view);
  notify();
}

export function targetOf(id: string): Measurable | undefined {
  return targets.get(id);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Changes whenever a target comes or goes, so a tour can wait for its first one. */
export function useTargetsVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}

/**
 * Where the target is now, or `undefined` when it is not on screen at all —
 * unmounted, of no size, or scrolled out of the window.
 */
export function measureTarget(
  id: string,
  windowHeight: number,
  done: (rect: TargetRect | undefined) => void,
): void {
  const view = targets.get(id);
  if (view === undefined) return done(undefined);
  view.measureInWindow((x, y, width, height) => {
    const visible = width > 0 && height > 0 && y + height > 0 && y < windowHeight;
    done(visible ? { x, y, width, height } : undefined);
  });
}
