import { clamp01, peakCurve } from '../curves';
import type { FactorScore, BiteInputs } from '../types';

/** Broken cloud keeps predators out of cover; a bald sky pins them down. */
const OPTIMAL_PERCENT = 70;
const SPAN_PERCENT = 55;
const BASE = 0.3;
const RANGE = 0.65;
const CLEAR_PERCENT = 25;
const OVERCAST_PERCENT = 85;

function coverKey(percent: number): string {
  if (percent <= CLEAR_PERCENT) return 'factor.cloud.clear';
  if (percent >= OVERCAST_PERCENT) return 'factor.cloud.overcast';
  return 'factor.cloud.broken';
}

export function cloudCoverFactor(inputs: BiteInputs): FactorScore {
  const percent = inputs.weather.cloudCoverPercent;

  return {
    id: 'cloudCover',
    score: clamp01(BASE + RANGE * peakCurve(percent, OPTIMAL_PERCENT, SPAN_PERCENT)),
    confidence: 1,
    explanationKey: coverKey(percent),
    explanationParams: { percent: Math.round(percent) },
  };
}
