import { FORECAST_DAYS, PAST_DAYS } from '@/services/weather';
import type { ForecastResponse, MarineResponse } from '@/services/weather';

const HOURS_PER_DAY = 24;
const TOTAL_DAYS = PAST_DAYS + FORECAST_DAYS;
const TOTAL_HOURS = TOTAL_DAYS * HOURS_PER_DAY;
const FIRST_DATE = new Date('2025-04-07T00:00:00Z');

function isoDate(dayIndex: number): string {
  const date = new Date(FIRST_DATE.getTime() + dayIndex * 86_400_000);
  return date.toISOString().slice(0, 10);
}

function series(value: (index: number) => number): number[] {
  return Array.from({ length: TOTAL_HOURS }, (_, index) => value(index));
}

/** A well-formed Open-Meteo payload; override any slice to model an edge case. */
export function makeForecastResponse(overrides: Partial<ForecastResponse> = {}): ForecastResponse {
  const { hourly, daily, ...rest } = overrides;
  return {
    latitude: 50.58,
    longitude: 30.49,
    utc_offset_seconds: 10_800,
    timezone: 'Europe/Kyiv',
    hourly: {
      time: Array.from(
        { length: TOTAL_HOURS },
        (_, i) => `${isoDate(Math.floor(i / 24))}T${String(i % 24).padStart(2, '0')}:00`,
      ),
      temperature_2m: series((i) => 10 + (i % 24) * 0.2),
      wind_speed_10m: series(() => 4),
      wind_direction_10m: series(() => 225),
      surface_pressure: series(() => 1000),
      pressure_msl: series((i) => 1010 - i * 0.01),
      cloud_cover: series(() => 70),
      precipitation_probability: series(() => 20),
      precipitation: series(() => 0.4),
      ...hourly,
    },
    daily: {
      time: Array.from({ length: TOTAL_DAYS }, (_, day) => isoDate(day)),
      sunrise: Array.from({ length: TOTAL_DAYS }, (_, day) => `${isoDate(day)}T05:41`),
      sunset: Array.from({ length: TOTAL_DAYS }, (_, day) => `${isoDate(day)}T19:58`),
      temperature_2m_min: Array.from({ length: TOTAL_DAYS }, () => 6),
      temperature_2m_max: Array.from({ length: TOTAL_DAYS }, () => 16),
      ...daily,
    },
    ...rest,
  };
}

export function makeMarineResponse(seaSurfaceTemperature = 11): MarineResponse {
  return {
    hourly: {
      time: Array.from({ length: TOTAL_HOURS }, (_, i) => `hour-${i}`),
      sea_surface_temperature: Array.from(
        { length: TOTAL_HOURS },
        (_, i) => seaSurfaceTemperature + Math.floor(i / HOURS_PER_DAY) * 0.3,
      ),
    },
  };
}
