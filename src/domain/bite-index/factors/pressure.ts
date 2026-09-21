import { peakCurve, towardNeutral } from '../curves';
import { profileFor } from '../species-profiles';
import type { FactorScore, BiteInputs } from '../types';

/** Fish feed on a slow fall; a sharp move either way shuts the bite down. */
const OPTIMAL_TREND_HPA = -3;
const TREND_SPAN_HPA = 9;
const TREND_EXPONENT = 1.4;
/** Even an insensitive species still reacts to pressure by at least this much. */
const BASE_SENSITIVITY = 0.55;
const STEADY_THRESHOLD_HPA = 1.5;

function trendKey(deltaHpa: number): string {
  if (deltaHpa <= -STEADY_THRESHOLD_HPA) return 'factor.pressure.falling';
  if (deltaHpa >= STEADY_THRESHOLD_HPA) return 'factor.pressure.rising';
  return 'factor.pressure.steady';
}

export function pressureFactor(inputs: BiteInputs): FactorScore {
  const { pressureHpa, pressure24hAgoHpa } = inputs.weather;
  const deltaHpa = pressureHpa - pressure24hAgoHpa;
  const raw = peakCurve(deltaHpa, OPTIMAL_TREND_HPA, TREND_SPAN_HPA, TREND_EXPONENT);
  const sensitivity =
    BASE_SENSITIVITY + (1 - BASE_SENSITIVITY) * profileFor(inputs.species).pressureSensitivity;

  return {
    id: 'pressure',
    score: towardNeutral(raw, sensitivity),
    confidence: 1,
    explanationKey: trendKey(deltaHpa),
    explanationParams: { delta: Math.round(deltaHpa * 10) / 10 },
  };
}
