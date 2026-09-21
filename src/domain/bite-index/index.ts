import { FACTOR_COMPUTATIONS } from './factors';
import { profileFor } from './species-profiles';
import { FACTOR_IDS } from './types';
import type {
  BestWindow,
  BiteInputs,
  BiteScore,
  DailyBiteScore,
  FactorScore,
  WeeklyInputs,
} from './types';
import { verdictFor } from './verdicts';
import { FACTOR_WEIGHTS } from './weights';

export const HOURS_PER_DAY = 24;
export const BEST_WINDOW_HOURS = 3;
/** Out of its season a species is still catchable, just markedly less so. */
const OFF_SEASON_MULTIPLIER = 0.75;

function seasonMultiplier(inputs: BiteInputs): number {
  return profileFor(inputs.species).seasonMonths.includes(inputs.month) ? 1 : OFF_SEASON_MULTIPLIER;
}

/** Re-aims the inputs at another hour, picking up that hour's weather if we have it. */
export function atHour(inputs: BiteInputs, hour: number): BiteInputs {
  return { ...inputs, hour, weather: inputs.hourlyWeather?.[hour] ?? inputs.weather };
}

/** All eight factors, always in the same order, for one hour of one day. */
export function computeFactors(inputs: BiteInputs): FactorScore[] {
  return FACTOR_IDS.map((id) => FACTOR_COMPUTATIONS[id](inputs));
}

function weightedValue(factors: readonly FactorScore[], multiplier: number): number {
  const weighted = factors.reduce(
    (sum, factor) => sum + FACTOR_WEIGHTS[factor.id] * factor.score,
    0,
  );
  return Math.round(Math.max(0, Math.min(100, weighted * multiplier * 100)));
}

function aggregateConfidence(factors: readonly FactorScore[]): number {
  const weighted = factors.reduce(
    (sum, factor) => sum + FACTOR_WEIGHTS[factor.id] * factor.confidence,
    0,
  );
  return Math.round(Math.max(0, Math.min(1, weighted)) * 1000) / 1000;
}

/** The 24-hour shape of the day, same units as the headline index. */
export function computeHourlyCurve(inputs: BiteInputs): number[] {
  const multiplier = seasonMultiplier(inputs);
  return Array.from({ length: HOURS_PER_DAY }, (_, hour) =>
    weightedValue(computeFactors(atHour(inputs, hour)), multiplier),
  );
}

/** The three consecutive hours with the highest combined score. */
export function findBestWindow(curve: readonly number[]): BestWindow {
  const last = curve.length - BEST_WINDOW_HOURS;
  let bestStart = 0;
  let bestSum = -1;
  for (let start = 0; start <= last; start += 1) {
    const sum = curve
      .slice(start, start + BEST_WINDOW_HOURS)
      .reduce((total, value) => total + value, 0);
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = start;
    }
  }
  return { startHour: bestStart, endHour: bestStart + BEST_WINDOW_HOURS };
}

/** The headline index for one hour, with the factors it was built from. */
export function computeBiteScore(
  inputs: BiteInputs,
  /** The day's curve, when the caller already has it; it is 24× the work of the score. */
  curve: readonly number[] = computeHourlyCurve(inputs),
): BiteScore {
  const factors = computeFactors(atHour(inputs, inputs.hour));
  const value = weightedValue(factors, seasonMultiplier(inputs));

  return {
    value,
    verdict: verdictFor(value),
    factors,
    bestWindow: findBestWindow(curve),
    confidence: aggregateConfidence(factors),
  };
}

/** Just the 0–100 number for one hour — all a chip or a map pin shows. */
export function computeScoreValue(inputs: BiteInputs): number {
  return weightedValue(computeFactors(atHour(inputs, inputs.hour)), seasonMultiplier(inputs));
}

/** One score per forecast day, each taken at that day's own best window. */
export function computeWeeklyForecast(inputs: WeeklyInputs): DailyBiteScore[] {
  return inputs.days.map((day, dayOffset) => {
    const dayInputs: BiteInputs = { ...day, species: inputs.species };
    const curve = computeHourlyCurve(dayInputs);
    const bestWindow = findBestWindow(curve);
    const peak = computeBiteScore({ ...dayInputs, hour: bestWindow.startHour + 1 }, curve);
    return { ...peak, bestWindow, dayOffset };
  });
}

export { FACTOR_IDS, HABITATS, SPECIES_IDS } from './types';
export type {
  BestWindow,
  BiteInputs,
  BiteScore,
  DailyBiteScore,
  FactorId,
  FactorScore,
  Habitat,
  MoonState,
  SpeciesId,
  SunTimes,
  VerdictId,
  WaterTemperature,
  WeatherSnapshot,
  WeeklyInputs,
} from './types';
export { FACTOR_WEIGHTS, totalWeight } from './weights';
export { SPECIES_PROFILES, profileFor, speciesOf } from './species-profiles';
export type { SpeciesProfile } from './species-profiles';
export { verdictFor, verdictNoteKey, verdictWordKey } from './verdicts';
