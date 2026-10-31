import { array, nullable, number, object, optional, schema, string } from '../validation';
import type { Infer } from '../validation';

/**
 * Every Open-Meteo response is validated here. Past this boundary the app only
 * ever sees domain types — never raw JSON.
 */
const numbers = array(nullable(number));
const strings = array(string);

const forecastResponse = object({
  latitude: number,
  longitude: number,
  utc_offset_seconds: number,
  timezone: string,
  elevation: optional(number),
  hourly: object({
    time: strings,
    temperature_2m: numbers,
    wind_speed_10m: numbers,
    wind_direction_10m: numbers,
    surface_pressure: numbers,
    pressure_msl: numbers,
    cloud_cover: numbers,
    precipitation_probability: numbers,
    precipitation: numbers,
  }),
  daily: object({
    time: strings,
    sunrise: strings,
    sunset: strings,
    temperature_2m_min: numbers,
    temperature_2m_max: numbers,
  }),
});

export const forecastResponseSchema = schema(forecastResponse);

export type ForecastResponse = Infer<typeof forecastResponse>;

const marineResponse = object({
  hourly: object({
    time: strings,
    sea_surface_temperature: numbers,
    /* Includes the tide; older cached answers and inland points lack it. */
    sea_level_height_msl: optional(numbers),
  }),
});

export const marineResponseSchema = schema(marineResponse);

export type MarineResponse = Infer<typeof marineResponse>;
