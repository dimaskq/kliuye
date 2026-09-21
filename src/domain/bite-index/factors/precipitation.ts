import { clamp01, plateauCurve } from '../curves';
import type { FactorScore, BiteInputs } from '../types';

/** Drizzle helps; a downpour does not. Dry weather is simply neutral. */
const DRIZZLE_RANGE_MM: readonly [number, number] = [0.1, 1.5];
const DRIZZLE_TOLERANCE_MM = 5;
const DRY_SCORE = 0.6;
const DRY_THRESHOLD_MM = 0.05;
const HEAVY_THRESHOLD_MM = 4;
/** A high chance of rain that has not started yet still nudges the score up. */
const PROBABILITY_WEIGHT = 0.1;

function rainKey(millimetres: number): string {
  if (millimetres < DRY_THRESHOLD_MM) return 'factor.precipitation.dry';
  if (millimetres >= HEAVY_THRESHOLD_MM) return 'factor.precipitation.heavy';
  return 'factor.precipitation.drizzle';
}

export function precipitationFactor(inputs: BiteInputs): FactorScore {
  const { precipitationMm, precipitationProbabilityPercent } = inputs.weather;
  const [low, high] = DRIZZLE_RANGE_MM;
  const wet = plateauCurve(precipitationMm, low, high, DRIZZLE_TOLERANCE_MM);
  const base = precipitationMm < DRY_THRESHOLD_MM ? DRY_SCORE : wet;
  const anticipation = (precipitationProbabilityPercent / 100) * PROBABILITY_WEIGHT;

  return {
    id: 'precipitation',
    score: clamp01(base + anticipation),
    confidence: 1,
    explanationKey: rainKey(precipitationMm),
    explanationParams: { probability: Math.round(precipitationProbabilityPercent) },
  };
}
