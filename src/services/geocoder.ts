import * as Location from 'expo-location';

import type { LatLng } from '@/domain/geo';

/** What a point is called: the settlement, and the district or region around it. */
export type PlaceName = {
  name?: string | undefined;
  area?: string | undefined;
};

function present(value: string | null | undefined): string | undefined {
  return value === null || value === undefined || value.trim() === '' ? undefined : value;
}

/**
 * The phone's own geocoder: free, no third-party vendor and nothing extra to
 * declare in the store forms. The settlement is the name; with none — a lake
 * in the woods, a bay — the district stands in, and the region goes underneath.
 */
export async function lookupPlace(coordinates: LatLng): Promise<PlaceName | undefined> {
  const [place] = await Location.reverseGeocodeAsync(coordinates);
  if (place === undefined) return undefined;
  const name = present(place.city) ?? present(place.district) ?? present(place.subregion);
  const area = [present(place.region), present(place.subregion)].find(
    (candidate) => candidate !== undefined && candidate !== name,
  );
  return name === undefined && area === undefined ? undefined : { name, area };
}
