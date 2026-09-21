import {
  computeBiteScore,
  computeHourlyCurve,
  computeScoreValue,
  computeWeeklyForecast,
} from '@/domain/bite-index';
import type { BiteInputs, BiteScore, DailyBiteScore, SpeciesId } from '@/domain/bite-index';
import { moonStateAt } from '@/domain/moon';
import type { Spot } from '@/domain/spots';
import { buildTips } from '@/domain/tips';
import type { Tip } from '@/domain/tips';
import type { DailyForecast, Forecast } from '@/services/weather';

export type BiteModel = {
  score: BiteScore;
  /** 24 values, index by local hour. */
  curve: number[];
  week: DailyBiteScore[];
  tips: Tip[];
  today: DailyForecast;
};

const MS_PER_DAY = 86_400_000;

/**
 * The hour whose weather stands in when an hour has no reading of its own, for
 * the parts of the model that do not depend on the selected hour.
 */
const REFERENCE_HOUR = 12;

/** Assembles the domain inputs for one day of a forecast at one spot. */
export function biteInputsFor(
  forecast: Forecast,
  day: DailyForecast,
  dayOffset: number,
  species: SpeciesId,
  hour: number,
): BiteInputs {
  const fallback = day.hourlyWeather[Math.min(hour, day.hourlyWeather.length - 1)];
  if (fallback === undefined) throw new Error(`Forecast day ${day.date} has no hourly weather`);

  return {
    species,
    hour,
    month: day.month,
    weather: fallback,
    hourlyWeather: day.hourlyWeather,
    sun: day.sun,
    moon: moonStateAt(new Date(forecast.fetchedAt + dayOffset * MS_PER_DAY)),
  };
}

function inputsAt(
  forecast: Forecast,
  spot: Spot,
  dayOffset: number,
  species: SpeciesId,
  hour: number,
): BiteInputs | undefined {
  const day = forecast.days[dayOffset];
  if (day === undefined) return undefined;
  return {
    ...biteInputsFor(forecast, day, dayOffset, species, hour),
    shoreBearingDeg: spot.shoreBearingDeg,
  };
}

/** Today's index for one species at one hour — the number on a chip or a pin. */
export function scoreValueAt(
  forecast: Forecast,
  spot: Spot,
  species: SpeciesId,
  hour: number,
): number | undefined {
  const inputs = inputsAt(forecast, spot, 0, species, hour);
  return inputs === undefined ? undefined : computeScoreValue(inputs);
}

type DayModel = Pick<BiteModel, 'curve' | 'week' | 'today'>;

/*
 * The curve and the week do not change with the selected hour, and they are
 * the expensive part. They are kept per forecast object — the one TanStack
 * Query hands every screen — so dragging along the hourly chart, and every hook
 * reading the same forecast, reuses one computation.
 */
const dayModels = new WeakMap<Forecast, Map<string, DayModel>>();

function dayModelFor(forecast: Forecast, spot: Spot, species: SpeciesId): DayModel | undefined {
  const key = `${spot.shoreBearingDeg ?? ''}|${species}`;
  const cached = dayModels.get(forecast)?.get(key);
  if (cached !== undefined) return cached;

  const today = forecast.days[0];
  const reference = inputsAt(forecast, spot, 0, species, REFERENCE_HOUR);
  if (today === undefined || reference === undefined) return undefined;

  const model: DayModel = {
    today,
    curve: computeHourlyCurve(reference),
    week: computeWeeklyForecast({
      species,
      days: forecast.days.map((day, offset) => {
        const { species: _ignored, ...rest } = biteInputsFor(
          forecast,
          day,
          offset,
          species,
          REFERENCE_HOUR,
        );
        return { ...rest, shoreBearingDeg: spot.shoreBearingDeg };
      }),
    }),
  };
  const perForecast = dayModels.get(forecast) ?? new Map<string, DayModel>();
  perForecast.set(key, model);
  dayModels.set(forecast, perForecast);
  return model;
}

/**
 * Everything the screens read is derived here — nothing about the index is
 * stored in component state.
 */
export function buildBiteModel(
  forecast: Forecast,
  spot: Spot,
  species: SpeciesId,
  hour: number,
): BiteModel | undefined {
  const day = dayModelFor(forecast, spot, species);
  const inputs = inputsAt(forecast, spot, 0, species, hour);
  if (day === undefined || inputs === undefined) return undefined;

  const score = computeBiteScore(inputs, day.curve);
  return { ...day, score, tips: buildTips(score.factors) };
}
