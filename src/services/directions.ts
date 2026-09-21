import { Linking, Platform } from 'react-native';

import type { LatLng } from '@/domain/geo';

export const TRAVEL_MODES = ['driving', 'walking'] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

/** Apple spells the same two modes with one letter. */
const APPLE_FLAG: Record<TravelMode, string> = { driving: 'd', walking: 'w' };

/**
 * Full precision, unlike the coordinates that go to the weather API: this one
 * is a destination the angler is about to drive to, and two decimals would
 * point a kilometre away.
 */
function coordinate({ latitude, longitude }: LatLng): string {
  return `${latitude},${longitude}`;
}

/**
 * A route to the water, drawn by whatever maps app the phone already trusts.
 *
 * No starting point is passed on purpose: the navigation app has the live
 * position, ours has a coarse one at best — and this way the route works even
 * when the location permission was never granted.
 */
export function directionsUrl(
  destination: LatLng,
  mode: TravelMode,
  platform: string = Platform.OS,
): string {
  const target = encodeURIComponent(coordinate(destination));
  if (platform === 'ios')
    return `https://maps.apple.com/?daddr=${target}&dirflg=${APPLE_FLAG[mode]}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=${mode}`;
}

/** False when the device has nothing that can open a map link. */
export async function openDirections(destination: LatLng, mode: TravelMode): Promise<boolean> {
  try {
    await Linking.openURL(directionsUrl(destination, mode));
    return true;
  } catch {
    return false;
  }
}
