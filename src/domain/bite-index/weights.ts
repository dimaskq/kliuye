import type { FactorId } from './types';

/**
 * Factor weights. They must sum to exactly 1 — a test guards that, so a new
 * factor cannot silently dilute the scale.
 */
export const FACTOR_WEIGHTS: Readonly<Record<FactorId, number>> = {
  pressure: 0.22,
  waterTemperature: 0.18,
  wind: 0.16,
  moon: 0.1,
  timeOfDay: 0.1,
  cloudCover: 0.08,
  precipitation: 0.08,
  airWaterDelta: 0.08,
};

export const WEIGHT_SUM_TOLERANCE = 1e-9;

export function totalWeight(): number {
  return Object.values(FACTOR_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
}
