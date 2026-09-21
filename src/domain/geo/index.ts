export type LatLng = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

/**
 * Coordinates are rounded to this before they leave the device, and the same
 * rounding decides whether two points are "the same place" (STORE_REVIEW.md §2).
 */
export const COORDINATE_PRECISION = 2;

/** Stable identity for a point: two taps a few metres apart are one place. */
export function pointKey({ latitude, longitude }: LatLng): string {
  return `${latitude.toFixed(COORDINATE_PRECISION)},${longitude.toFixed(COORDINATE_PRECISION)}`;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance — accurate enough for "how far is that water". */
export function distanceKm(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
