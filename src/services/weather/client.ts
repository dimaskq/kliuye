import { COORDINATE_PRECISION } from '@/domain/geo';

import { AppError } from '../errors';
import { getJson } from '../http';

import { toForecast, FORECAST_DAYS, PAST_DAYS } from './mapper';
import { forecastResponseSchema, marineResponseSchema } from './schemas';
import type { Coordinates, Forecast } from './types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const HOURLY_FIELDS = [
  'temperature_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'surface_pressure',
  'pressure_msl',
  'cloud_cover',
  'precipitation_probability',
  'precipitation',
].join(',');

const DAILY_FIELDS = ['sunrise', 'sunset', 'temperature_2m_min', 'temperature_2m_max'].join(',');

function round(value: number): string {
  return value.toFixed(COORDINATE_PRECISION);
}

function commonParams({ latitude, longitude }: Coordinates): URLSearchParams {
  return new URLSearchParams({
    latitude: round(latitude),
    longitude: round(longitude),
    timezone: 'auto',
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
  });
}

function parse<T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T } },
  payload: unknown,
  what: string,
): T {
  const result = schema.safeParse(payload);
  if (!result.success || result.data === undefined) {
    throw new AppError('validation', `${what} response did not match the expected shape`);
  }
  return result.data;
}

/** Sea-surface temperature exists only for coastal points; its absence is normal. */
async function fetchMarine(coordinates: Coordinates, signal: AbortSignal | undefined) {
  const params = commonParams(coordinates);
  params.set('hourly', 'sea_surface_temperature');
  try {
    return parse(
      marineResponseSchema,
      await getJson(`${MARINE_URL}?${params.toString()}`, { signal }),
      'Marine',
    );
  } catch {
    return undefined;
  }
}

export async function fetchForecast(
  coordinates: Coordinates,
  now: Date,
  signal?: AbortSignal,
): Promise<Forecast> {
  const params = commonParams(coordinates);
  params.set('hourly', HOURLY_FIELDS);
  params.set('daily', DAILY_FIELDS);
  params.set('wind_speed_unit', 'ms');

  const [payload, marine] = await Promise.all([
    getJson(`${FORECAST_URL}?${params.toString()}`, { signal }),
    fetchMarine(coordinates, signal),
  ]);

  return toForecast(parse(forecastResponseSchema, payload, 'Forecast'), marine, now.getTime());
}
