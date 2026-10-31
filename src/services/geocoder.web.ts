import type { LatLng } from '@/domain/geo';

import { getJson } from './http';

export type PlaceName = {
  name?: string | undefined;
  area?: string | undefined;
};

/**
 * The browser has no geocoder of its own, so the preview asks OpenStreetMap's
 * Nominatim — one request per tap, well inside its usage policy. The phone
 * never calls it: it uses the operating system's geocoder.
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

type Address = Partial<Record<string, string>>;

const SETTLEMENT = ['city', 'town', 'village', 'hamlet', 'municipality', 'suburb'] as const;
const DISTRICT = ['district', 'county'] as const;

function first(address: Address, keys: readonly string[]): string | undefined {
  return keys.map((key) => address[key]).find((value) => value !== undefined && value !== '');
}

export async function lookupPlace(coordinates: LatLng): Promise<PlaceName | undefined> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    zoom: '10',
    addressdetails: '1',
    'accept-language': navigator.language,
  });
  const answer = (await getJson(`${NOMINATIM_URL}?${params.toString()}`)) as {
    address?: Address;
  };
  const address = answer.address ?? {};
  const name = first(address, SETTLEMENT) ?? first(address, DISTRICT);
  const area = [address['state'], first(address, DISTRICT)].find(
    (candidate) => candidate !== undefined && candidate !== '' && candidate !== name,
  );
  return name === undefined && area === undefined ? undefined : { name, area };
}
