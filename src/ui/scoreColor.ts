import { accent, accent2, neutral, palette } from './tokens/colors';
import type { Colors } from './tokens/colors';

/**
 * The one place the 0–100 index turns into colour (DESIGN_SPEC.md §2).
 * Used by the ring, the hourly bars, the week track and the map pins.
 */
type ScoreBand = {
  readonly min: number;
  readonly fill: string;
  /** Which step of the theme's scale the text takes: deep by day, pale at night. */
  readonly onFill: (colors: Colors) => string;
};

const BANDS: readonly ScoreBand[] = [
  /* The fills are the same in both themes: a colour means the same number. */
  { min: 78, fill: palette.accent, onFill: (colors) => colors.accent700 },
  { min: 60, fill: accent[400], onFill: (colors) => colors.accent600 },
  { min: 40, fill: accent2[400], onFill: (colors) => colors.accent2700 },
  { min: 22, fill: accent2[300], onFill: (colors) => colors.accent2800 },
];

/** Below 22 the index is drawn in muted neutral, never in an accent. */
const LOWEST: ScoreBand = {
  min: 0,
  fill: neutral[300],
  onFill: (colors) => colors.neutral[700],
};

function bandFor(value: number): ScoreBand {
  return BANDS.find((band) => value >= band.min) ?? LOWEST;
}

/** Fill colour for the ring arc, bars, week track and pins. */
export function scoreFill(value: number): string {
  return bandFor(value).fill;
}

/** Text colour that stays legible for the same band on the screen background. */
export function scoreTextColor(value: number, colors: Colors): string {
  return bandFor(value).onFill(colors);
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
