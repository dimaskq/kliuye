import { plateauCurve } from '../curves';
import { profileFor } from '../species-profiles';
import type { FactorScore, BiteInputs } from '../types';

/** Without a reading we neither reward nor punish — we just say so. */
const UNKNOWN_SCORE = 0.5;
const UNKNOWN_CONFIDENCE = 0.45;
const ESTIMATED_CONFIDENCE = 0.75;
const WARMING_THRESHOLD_C = 0.5;

function trendKey(trendC: number | undefined): string {
  if (trendC === undefined) return 'factor.water.steady';
  if (trendC >= WARMING_THRESHOLD_C) return 'factor.water.warming';
  if (trendC <= -WARMING_THRESHOLD_C) return 'factor.water.cooling';
  return 'factor.water.steady';
}

export function waterTemperatureFactor(inputs: BiteInputs): FactorScore {
  const { waterTemperature, waterTrendC } = inputs.weather;
  if (waterTemperature === undefined) {
    return {
      id: 'waterTemperature',
      score: UNKNOWN_SCORE,
      confidence: UNKNOWN_CONFIDENCE,
      explanationKey: 'factor.water.unknown',
    };
  }

  const { optimalWaterC, waterToleranceC } = profileFor(inputs.species);
  const [low, high] = optimalWaterC;

  return {
    id: 'waterTemperature',
    score: plateauCurve(waterTemperature.celsius, low, high, waterToleranceC),
    confidence: waterTemperature.estimated ? ESTIMATED_CONFIDENCE : 1,
    explanationKey: trendKey(waterTrendC),
    explanationParams: { trend: Math.round((waterTrendC ?? 0) * 10) / 10 },
  };
}
