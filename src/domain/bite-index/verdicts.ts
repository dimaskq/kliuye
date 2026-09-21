import type { VerdictId } from './types';

type VerdictBand = {
  readonly id: VerdictId;
  readonly min: number;
};

/** DESIGN_SPEC.md §2. Copy lives in i18n under `verdict.<id>.{word,note}`. */
const BANDS: readonly VerdictBand[] = [
  { id: 'feeding', min: 82 },
  { id: 'good', min: 66 },
  { id: 'moderate', min: 46 },
  { id: 'weak', min: 26 },
];

/** Anything below the lowest band, including a NaN, reads as a dead bite. */
const FALLBACK: VerdictId = 'dead';

export function verdictFor(value: number): VerdictId {
  return BANDS.find((band) => value >= band.min)?.id ?? FALLBACK;
}

export function verdictWordKey(id: VerdictId): string {
  return `verdict.${id}.word`;
}

export function verdictNoteKey(id: VerdictId): string {
  return `verdict.${id}.note`;
}
