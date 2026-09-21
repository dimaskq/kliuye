import type { FactorComputation, FactorId } from '../types';

import { airWaterDeltaFactor } from './air-water-delta';
import { cloudCoverFactor } from './cloud-cover';
import { moonFactor } from './moon';
import { precipitationFactor } from './precipitation';
import { pressureFactor } from './pressure';
import { timeOfDayFactor } from './time-of-day';
import { waterTemperatureFactor } from './water-temperature';
import { windFactor } from './wind';

/**
 * The registry that makes the model extensible: a new factor is a new file plus
 * one line here and one weight. No screen changes.
 */
export const FACTOR_COMPUTATIONS: Readonly<Record<FactorId, FactorComputation>> = {
  wind: windFactor,
  airWaterDelta: airWaterDeltaFactor,
  waterTemperature: waterTemperatureFactor,
  pressure: pressureFactor,
  moon: moonFactor,
  precipitation: precipitationFactor,
  cloudCover: cloudCoverFactor,
  timeOfDay: timeOfDayFactor,
};

export { airWaterDeltaFactor } from './air-water-delta';
export { cloudCoverFactor } from './cloud-cover';
export { moonFactor } from './moon';
export { precipitationFactor } from './precipitation';
export { pressureFactor } from './pressure';
export { timeOfDayFactor } from './time-of-day';
export { waterTemperatureFactor } from './water-temperature';
export { windFactor } from './wind';
