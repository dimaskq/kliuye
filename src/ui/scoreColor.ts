import { colors } from './tokens';

/**
 * The one place the 0–100 index turns into colour (DESIGN_SPEC.md §2).
 * Used by the ring, the hourly bars, the week track and the map pins.
 */
type ScoreBand = {
  readonly min: number;
  readonly fill: string;
  readonly onFill: string;
};

const BANDS: readonly ScoreBand[] = [
  { min: 78, fill: colors.accent, onFill: colors.accent700 },
  { min: 60, fill: colors.accent400, onFill: colors.accent600 },
  { min: 40, fill: colors.accent2400, onFill: colors.accent2700 },
  { min: 22, fill: colors.accent2300, onFill: colors.accent2800 },
];

/** Below 22 the index is drawn in muted neutral, never in an accent. */
const LOWEST: ScoreBand = { min: 0, fill: colors.neutral[300], onFill: colors.neutral[700] };

function bandFor(value: number): ScoreBand {
  return BANDS.find((band) => value >= band.min) ?? LOWEST;
}

/** Fill colour for the ring arc, bars, week track and pins. */
export function scoreFill(value: number): string {
  return bandFor(value).fill;
}

/** Text colour that stays legible for the same band on the cream background. */
export function scoreTextColor(value: number): string {
  return bandFor(value).onFill;
}

const VISIBLE_MIN = 4;
const VISIBLE_MAX = 99;

/**
 * Visual clamp: a ring or bar at 0 or 100 would read as broken, so drawing
 * clamps to [4, 99]. The logical score stays untouched.
 */
export function clampForDisplay(value: number): number {
  return Math.max(VISIBLE_MIN, Math.min(VISIBLE_MAX, Math.round(value)));
}
