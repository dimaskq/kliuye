import { array, number, object, optional, schema, string } from '../validation';
import type { Infer } from '../validation';

const result = object({
  id: number,
  name: string,
  latitude: number,
  longitude: number,
  country: optional(string),
  country_code: optional(string),
  admin1: optional(string),
  feature_code: optional(string),
  population: optional(number),
});

/**
 * Open-Meteo's geocoding search. A query with no matches comes back without a
 * `results` key at all, so the field is optional rather than an empty array.
 */
const geocodingResponse = object({ results: optional(array(result)) });

export const geocodingResponseSchema = schema(geocodingResponse);

export type GeocodingResponse = Infer<typeof geocodingResponse>;
