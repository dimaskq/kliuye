import type { Polygon } from '@/domain/coast';

/**
 * Vector tile geometry: the MoveTo / LineTo / ClosePath command stream, turned
 * into polygon rings and polylines in the tile's own grid.
 */

/** A polyline in the tile's own grid. */
export type Line = readonly (readonly [number, number])[];

const MOVE_TO = 1;
const LINE_TO = 2;
const CLOSE_PATH = 7;

function zigzag(value: number): number {
  return value % 2 === 0 ? value / 2 : -(value + 1) / 2;
}

/** Closes a ring and files it: an outer ring opens a polygon, anything else is its hole. */
function closeRing(ring: [number, number][], polygons: [number, number][][][]): void {
  if (ring.length === 0) return;
  ring.push(ring[0]!);
  if (signedArea(ring) > 0 || polygons.length === 0) polygons.push([ring]);
  else polygons.at(-1)!.push(ring);
}

/**
 * Turns the command stream into rings. A new outer ring — positive area in the
 * tile's y-down grid — starts a new polygon; the rings after it are its holes.
 */
export function decodePolygons(geometry: readonly number[]): Polygon[] {
  const polygons: [number, number][][][] = [];
  let ring: [number, number][] = [];
  let x = 0;
  let y = 0;
  let i = 0;

  while (i < geometry.length) {
    const command = geometry[i]! & 0x7;
    const count = geometry[i]! >> 3;
    i += 1;
    if (command === CLOSE_PATH) {
      closeRing(ring, polygons);
      ring = [];
      continue;
    }
    for (let n = 0; n < count; n += 1) {
      x += zigzag(geometry[i]!);
      y += zigzag(geometry[i + 1]!);
      i += 2;
      if (command === MOVE_TO) ring = [[x, y]];
      else if (command === LINE_TO) ring.push([x, y]);
    }
  }
  return polygons;
}

/** Each MoveTo starts a line; the LineTos after it extend it. */
export function decodeLines(geometry: readonly number[]): Line[] {
  const lines: [number, number][][] = [];
  let x = 0;
  let y = 0;
  let i = 0;

  while (i < geometry.length) {
    const command = geometry[i]! & 0x7;
    const count = geometry[i]! >> 3;
    i += 1;
    if (command === CLOSE_PATH) continue;
    for (let n = 0; n < count; n += 1) {
      x += zigzag(geometry[i]!);
      y += zigzag(geometry[i + 1]!);
      i += 2;
      if (command === MOVE_TO) lines.push([[x, y]]);
      else if (command === LINE_TO) lines.at(-1)?.push([x, y]);
    }
  }
  return lines;
}

function signedArea(ring: readonly (readonly [number, number])[]): number {
  let sum = 0;
  for (let i = 1; i < ring.length; i += 1) {
    const [ax, ay] = ring[i - 1]!;
    const [bx, by] = ring[i]!;
    sum += ax * by - bx * ay;
  }
  return sum / 2;
}
