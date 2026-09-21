import { AppError } from '../errors';
import { getJson } from '../http';

import { geocodingResponseSchema } from './schemas';
import type { GeocodingResponse } from './schemas';
import type { Place } from './types';

const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** Shorter queries match half the planet and are not worth a request. */
export const MIN_QUERY_LENGTH = 2;
const RESULT_COUNT = 8;

/** Airports and the like are not places anyone fishes from. */
const SETTLEMENT_PREFIX = 'PPL';

function toPlace(result: NonNullable<GeocodingResponse['results']>[number]): Place {
  return {
    id: String(result.id),
    name: result.name,
    context: [result.country, result.admin1].filter(Boolean).join(' · '),
    coordinates: { latitude: result.latitude, longitude: result.longitude },
  };
}

/**
 * Settlement search, same provider as the forecast: no API key, no billing and
 * one attribution to make (STORE_REVIEW.md §4).
 */
export async function searchPlaces(
  query: string,
  language: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: String(RESULT_COUNT),
    language,
    format: 'json',
  });

  const payload = await getJson(`${SEARCH_URL}?${params.toString()}`, { signal });
  const parsed = geocodingResponseSchema.safeParse(payload);
  if (!parsed.success)
    throw new AppError('validation', 'Geocoding response did not match the expected shape');

  return (parsed.data.results ?? [])
    .filter((result) => result.feature_code?.startsWith(SETTLEMENT_PREFIX) ?? true)
    .map(toPlace);
}
