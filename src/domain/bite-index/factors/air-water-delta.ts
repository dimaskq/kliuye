import { peakCurve } from '../curves';
import type { FactorScore, BiteInputs } from '../types';

/**
 * Air a touch warmer than the water means a stable, warming day. A cold snap
 * over warm water pushes fish down and off the feed.
 */
const OPTIMAL_DELTA_C = 2.5;
const SPAN_C = 9;
const UNKNOWN_SCORE = 0.5;
const UNKNOWN_CONFIDENCE = 0.5;
const STEADY_DELTA_C = 1.5;

function deltaKey(deltaC: number): string {
  if (deltaC <= -STEADY_DELTA_C) return 'factor.airWater.colder';
  if (deltaC >= STEADY_DELTA_C) return 'factor.airWater.warmer';
  return 'factor.airWater.even';
}

export function airWaterDeltaFactor(inputs: BiteInputs): FactorScore {
  const { airTemperatureC, nightAirTemperatureC, waterTemperature } = inputs.weather;
  if (waterTemperature === undefined) {
    return {
      id: 'airWaterDelta',
      score: UNKNOWN_SCORE,
      confidence: UNKNOWN_CONFIDENCE,
      explanationKey: 'factor.airWater.unknown',
      explanationParams: { night: Math.round(nightAirTemperatureC) },
    };
  }

  const deltaC = airTemperatureC - waterTemperature.celsius;

  return {
    id: 'airWaterDelta',
    score: peakCurve(deltaC, OPTIMAL_DELTA_C, SPAN_C),
    confidence: waterTemperature.estimated ? 0.8 : 1,
    explanationKey: deltaKey(deltaC),
    explanationParams: { night: Math.round(nightAirTemperatureC) },
  };
}
