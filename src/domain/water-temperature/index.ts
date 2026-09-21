import type { WaterTemperature } from '../bite-index/types';

/**
 * Inland waters have no public sensor network, so we estimate: a five-day mean
 * of the air temperature plus a seasonal correction. The result is always
 * flagged as an estimate — the UI shows it with a "≈" (STORE_REVIEW.md §4).
 */
export const ESTIMATE_WINDOW_DAYS = 5;

/** Water lags the air: it stays cooler while spring warms and warmer in autumn. */
const SEASONAL_CORRECTION_C: Readonly<Record<number, number>> = {
  1: 1.5,
  2: 1,
  3: -1,
  4: -2.5,
  5: -3,
  6: -2,
  7: -0.5,
  8: 0.5,
  9: 1.5,
  10: 2.5,
  11: 2,
  12: 1.5,
};

const FREEZING_FLOOR_C = 0;

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * @param dailyMeanAirC daily mean air temperatures, most recent last.
 * @param month calendar month, 1–12.
 */
export function estimateWaterTemperature(
  dailyMeanAirC: readonly number[],
  month: number,
): WaterTemperature | undefined {
  const window = dailyMeanAirC.slice(-ESTIMATE_WINDOW_DAYS);
  if (window.length === 0) return undefined;

  const correction = SEASONAL_CORRECTION_C[month] ?? 0;
  const celsius = Math.max(FREEZING_FLOOR_C, Math.round((mean(window) + correction) * 10) / 10);
  return { celsius, estimated: true };
}

/** A measured sea-surface reading is used as is, and marked as measured. */
export function measuredWaterTemperature(
  celsius: number | null | undefined,
): WaterTemperature | undefined {
  return celsius === null || celsius === undefined ? undefined : { celsius, estimated: false };
}
