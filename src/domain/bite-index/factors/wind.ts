import { bearingDistance, clamp01, peakCurve } from '../curves';
import { profileFor } from '../species-profiles';
import type { FactorScore, BiteInputs } from '../types';

/** A light ripple beats both dead calm and a blow. */
const OPTIMAL_SPEED_MS = 4;
const SPAN_MARGIN_MS = 2;
const CALM_SPEED_MS = 1;
const STRONG_SPEED_MS = 8;
/** Wind pushing food onto the bank is worth a bonus; offshore wind is not. */
const ONSHORE_BONUS = 0.12;
const ONSHORE_TOLERANCE_DEG = 60;

function speedKey(speedMs: number): string {
  if (speedMs < CALM_SPEED_MS) return 'factor.wind.calm';
  if (speedMs >= STRONG_SPEED_MS) return 'factor.wind.strong';
  return 'factor.wind.ripple';
}

function onshoreAdjustment(inputs: BiteInputs): number {
  const { shoreBearingDeg } = inputs;
  if (shoreBearingDeg === undefined) return 0;
  const offset = bearingDistance(inputs.weather.windDirectionDeg, shoreBearingDeg);
  return offset <= ONSHORE_TOLERANCE_DEG ? ONSHORE_BONUS : -ONSHORE_BONUS;
}

export function windFactor(inputs: BiteInputs): FactorScore {
  const { windSpeedMs, windDirectionDeg } = inputs.weather;
  const span = profileFor(inputs.species).windToleranceMs + SPAN_MARGIN_MS;
  const raw = peakCurve(windSpeedMs, OPTIMAL_SPEED_MS, span, 1.5);

  return {
    id: 'wind',
    score: clamp01(raw + onshoreAdjustment(inputs)),
    confidence: 1,
    explanationKey: speedKey(windSpeedMs),
    explanationParams: { speed: Math.round(windSpeedMs), direction: Math.round(windDirectionDeg) },
  };
}
