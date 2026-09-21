import type { SunTimes, WaterTemperature, WeatherSnapshot } from '@/domain/bite-index';
import { estimateWaterTemperature, measuredWaterTemperature } from '@/domain/water-temperature';

import { AppError } from '../errors';

import type { ForecastResponse, MarineResponse } from './schemas';
import type { DailyForecast, Forecast } from './types';

export const PAST_DAYS = 5;
export const FORECAST_DAYS = 7;
const HOURS_PER_DAY = 24;

function at(values: readonly (number | null)[], index: number): number | null {
  return values[index] ?? null;
}

/** A gap in the series is a broken response, not something to paper over. */
function required(values: readonly (number | null)[], index: number, field: string): number {
  const value = at(values, index);
  if (value === null) throw new AppError('validation', `Missing ${field} at hour ${index}`);
  return value;
}

const CLOCK_PATTERN = /T(\d{2}):(\d{2})/;
const MONTH_PATTERN = /^\d{4}-(\d{2})-\d{2}/;

/** "2025-04-12T05:41" → 5.68 hours; a date without a time reads as midnight. */
export function hourOfDay(isoLocalTime: string): number {
  const match = CLOCK_PATTERN.exec(isoLocalTime);
  if (match === null) return 0;
  const [, hours, minutes] = match;
  return Number(hours) + Number(minutes) / 60;
}

/** "2025-04-12" → 4. A date the API should never send is a validation failure. */
export function monthOf(isoDate: string): number {
  const match = MONTH_PATTERN.exec(isoDate);
  if (match === null) throw new AppError('validation', `Unexpected date "${isoDate}"`);
  return Number(match[1]);
}

function sunTimesFor(response: ForecastResponse, dayIndex: number): SunTimes {
  const sunrise = response.daily.sunrise[dayIndex];
  const sunset = response.daily.sunset[dayIndex];
  if (sunrise === undefined || sunset === undefined) {
    throw new AppError('validation', `Missing sun times for day ${dayIndex}`);
  }
  return { sunriseHour: hourOfDay(sunrise), sunsetHour: hourOfDay(sunset) };
}

/** Mean of the five days before today, used when no sensor reading exists. */
function recentDailyMeanAir(response: ForecastResponse): number[] {
  return Array.from({ length: PAST_DAYS }, (_, day) => {
    const min = at(response.daily.temperature_2m_min, day);
    const max = at(response.daily.temperature_2m_max, day);
    return min === null || max === null ? null : (min + max) / 2;
  }).filter((value): value is number => value !== null);
}

function waterAt(
  marine: MarineResponse | undefined,
  index: number,
  fallback: WaterTemperature | undefined,
) {
  return measuredWaterTemperature(marine?.hourly.sea_surface_temperature[index]) ?? fallback;
}

function snapshotAt(
  response: ForecastResponse,
  index: number,
  nightAirTemperatureC: number,
  water: WaterTemperature | undefined,
  waterTrendC: number | undefined,
): WeatherSnapshot {
  const { hourly } = response;
  return {
    airTemperatureC: required(hourly.temperature_2m, index, 'temperature'),
    nightAirTemperatureC,
    windSpeedMs: required(hourly.wind_speed_10m, index, 'wind speed'),
    windDirectionDeg: required(hourly.wind_direction_10m, index, 'wind direction'),
    pressureHpa: required(hourly.pressure_msl, index, 'pressure'),
    pressure24hAgoHpa: required(hourly.pressure_msl, index - HOURS_PER_DAY, 'pressure 24 h ago'),
    cloudCoverPercent: required(hourly.cloud_cover, index, 'cloud cover'),
    precipitationProbabilityPercent: at(hourly.precipitation_probability, index) ?? 0,
    precipitationMm: at(hourly.precipitation, index) ?? 0,
    waterTemperature: water,
    waterTrendC,
  };
}

function dayAt(
  response: ForecastResponse,
  marine: MarineResponse | undefined,
  dayOffset: number,
  estimated: WaterTemperature | undefined,
): DailyForecast {
  const dayIndex = PAST_DAYS + dayOffset;
  const date = response.daily.time[dayIndex];
  if (date === undefined) throw new AppError('validation', `Missing day ${dayOffset}`);

  const night = at(response.daily.temperature_2m_min, dayIndex) ?? 0;
  const base = dayIndex * HOURS_PER_DAY;
  const water = waterAt(marine, base, estimated);
  const previousWater = waterAt(marine, base - HOURS_PER_DAY, estimated);
  const trend = water && previousWater ? water.celsius - previousWater.celsius : undefined;

  return {
    date,
    month: monthOf(date),
    sun: sunTimesFor(response, dayIndex),
    hourlyWeather: Array.from({ length: HOURS_PER_DAY }, (_, hour) =>
      snapshotAt(response, base + hour, night, waterAt(marine, base + hour, estimated), trend),
    ),
  };
}

/** Validated API payloads in, domain-shaped forecast out. */
export function toForecast(
  response: ForecastResponse,
  marine: MarineResponse | undefined,
  fetchedAt: number,
): Forecast {
  const firstDate = response.daily.time[PAST_DAYS];
  if (firstDate === undefined) {
    throw new AppError('validation', 'Forecast is missing the requested past-days window');
  }
  const estimated = estimateWaterTemperature(recentDailyMeanAir(response), monthOf(firstDate));

  return {
    fetchedAt,
    timezone: response.timezone,
    utcOffsetSeconds: response.utc_offset_seconds,
    days: Array.from({ length: FORECAST_DAYS }, (_, dayOffset) =>
      dayAt(response, marine, dayOffset, estimated),
    ),
  };
}
