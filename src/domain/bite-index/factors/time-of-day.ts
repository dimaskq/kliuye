import { bellCurve, clamp01, hourDistance, towardNeutral } from '../curves';
import { profileFor } from '../species-profiles';
import type { FactorScore, BiteInputs, SunTimes } from '../types';

/** The bite peaks shortly after first light and again around last light. */
const PEAK_OFFSET_HOURS = 1;
const PEAK_SIGMA_HOURS = 1.6;
const NIGHT_BASE = 0.25;
const DAYLIGHT_BONUS = 0.15;
const PEAK_RANGE = 0.6;

function peakStrength(hour: number, sun: SunTimes): number {
  const morning = bellCurve(
    hourDistance(hour, sun.sunriseHour + PEAK_OFFSET_HOURS),
    PEAK_SIGMA_HOURS,
  );
  const evening = bellCurve(
    hourDistance(hour, sun.sunsetHour - PEAK_OFFSET_HOURS),
    PEAK_SIGMA_HOURS,
  );
  return Math.max(morning, evening);
}

function isDaylight(hour: number, sun: SunTimes): boolean {
  return hour >= sun.sunriseHour && hour <= sun.sunsetHour;
}

function windowKey(hour: number, sun: SunTimes): string {
  if (hourDistance(hour, sun.sunriseHour + PEAK_OFFSET_HOURS) <= PEAK_SIGMA_HOURS)
    return 'factor.time.dawn';
  if (hourDistance(hour, sun.sunsetHour - PEAK_OFFSET_HOURS) <= PEAK_SIGMA_HOURS)
    return 'factor.time.dusk';
  return isDaylight(hour, sun) ? 'factor.time.day' : 'factor.time.night';
}

export function timeOfDayFactor(inputs: BiteInputs): FactorScore {
  const { hour, sun } = inputs;
  const daylight = isDaylight(hour, sun) ? DAYLIGHT_BONUS : 0;
  const raw = clamp01(NIGHT_BASE + daylight + PEAK_RANGE * peakStrength(hour, sun));

  return {
    id: 'timeOfDay',
    score: towardNeutral(raw, profileFor(inputs.species).dielAmplitude),
    confidence: 1,
    explanationKey: windowKey(hour, sun),
    explanationParams: { sunrise: sun.sunriseHour, sunset: sun.sunsetHour },
  };
}
