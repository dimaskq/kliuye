/**
 * How well a species bites in each month of the year, as a multiplier on the
 * weather score. The levels are coarse on purpose: fishing calendars agree on
 * "peak", "poor" and "not at all", not on percentages.
 */
export const PEAK = 1;
export const GOOD = 0.9;
export const FAIR = 0.75;
export const POOR = 0.5;
/** Not caught at all: winter dormancy, the fish has migrated away, or a legal closure. */
export const NONE = 0;

/** January first. */
export type MonthlyActivity = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** A month at `FAIR` or better counts as the species' season. */
export const IN_SEASON_FROM = FAIR;

export const ALL_YEAR: MonthlyActivity = [
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
  PEAK,
];

/** The multiplier for month 1–12. */
export function activityIn(activity: MonthlyActivity, month: number): number {
  return activity[month - 1] ?? NONE;
}
