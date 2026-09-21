import { distanceKm } from '../geo';
import type { LatLng } from '../geo';

/**
 * A bundled catalogue of waters. It ships with the app so that every screen
 * works with location denied and with no network (STORE_REVIEW.md §1, §5).
 */
export type Spot = {
  readonly id: string;
  /** i18n keys — water names are localised, never hard-coded strings. */
  readonly nameKey: string;
  /** Interpolation for a name the user supplied, such as a searched settlement. */
  readonly nameParams?: Record<string, string | number> | undefined;
  readonly metaKey: string;
  readonly metaParams?: Record<string, string | number> | undefined;
  /** i18n key for the settlement shown in the Today header. */
  readonly regionKey: string;
  readonly regionParams?: Record<string, string | number> | undefined;
  readonly coordinates: LatLng;
  /** Bearing of the open water seen from the usual bank, for the wind factor. */
  readonly shoreBearingDeg?: number | undefined;
};

const VYSHHOROD = 'spots.region.vyshhorod';

export const SPOTS: readonly Spot[] = [
  {
    id: 's1',
    nameKey: 'spots.s1.name',
    metaKey: 'spots.s1.meta',
    regionKey: VYSHHOROD,
    coordinates: { latitude: 50.62, longitude: 30.48 },
    shoreBearingDeg: 240,
  },
  {
    id: 's2',
    nameKey: 'spots.s2.name',
    metaKey: 'spots.s2.meta',
    regionKey: VYSHHOROD,
    coordinates: { latitude: 50.71, longitude: 30.53 },
    shoreBearingDeg: 200,
  },
  {
    id: 's3',
    nameKey: 'spots.s3.name',
    metaKey: 'spots.s3.meta',
    regionKey: VYSHHOROD,
    coordinates: { latitude: 50.76, longitude: 30.41 },
    shoreBearingDeg: 300,
  },
  {
    id: 's4',
    nameKey: 'spots.s4.name',
    metaKey: 'spots.s4.meta',
    regionKey: VYSHHOROD,
    coordinates: { latitude: 50.79, longitude: 30.34 },
    shoreBearingDeg: 90,
  },
];

export const DEFAULT_SPOT: Spot = SPOTS[0]!;

/**
 * The device's own position, treated as a first-class water. Open-Meteo covers
 * the whole globe, so this is what makes the forecast correct outside the
 * bundled catalogue's region.
 */
export const CURRENT_LOCATION_SPOT_ID = 'here';

/** Waters further away than this are not "nearby" and are not offered. */
export const NEARBY_RADIUS_KM = 150;

const COORDINATE_DIGITS = 3;

/** Coordinates are the one place name that is always true. */
export function formatPosition({ latitude, longitude }: LatLng): string {
  return `${latitude.toFixed(COORDINATE_DIGITS)}, ${longitude.toFixed(COORDINATE_DIGITS)}`;
}

/**
 * Naming a point without a settlement name would mean guessing, and a guess
 * here reads as fact — so an unnamed point says where it is instead.
 */
function place(coordinates: LatLng, name: string | undefined) {
  const known = name !== undefined && name !== '';
  return {
    key: known ? 'named' : 'unnamed',
    params: { place: known ? name : '', position: formatPosition(coordinates) },
  };
}

export function currentLocationSpot(origin: LatLng, city?: string | undefined): Spot {
  const { key, params } = place(origin, city);
  return {
    id: CURRENT_LOCATION_SPOT_ID,
    nameKey: 'spots.here.name',
    metaKey: 'spots.here.meta',
    metaParams: params,
    regionKey: `spots.here.region.${key}`,
    regionParams: params,
    coordinates: origin,
    /* The bank we would stand on is unknown, so wind direction stays neutral. */
    shoreBearingDeg: undefined,
  };
}

/** A point the user picked on the map or found by searching for a settlement. */
export type CustomPoint = LatLng & {
  /** Settlement name, once one is known; empty until then. */
  label: string;
};

export const CUSTOM_SPOT_ID = 'custom';

export function customSpot(point: CustomPoint): Spot {
  const coordinates = { latitude: point.latitude, longitude: point.longitude };
  const { key, params } = place(coordinates, point.label);
  return {
    id: CUSTOM_SPOT_ID,
    nameKey: `spots.custom.${key}`,
    nameParams: params,
    metaKey: 'spots.custom.meta',
    metaParams: params,
    regionKey: 'spots.custom.region',
    regionParams: params,
    coordinates,
    /* Neither a searched settlement nor a tap tells us which bank we would fish. */
    shoreBearingDeg: undefined,
  };
}

export type SpotSelection = {
  /** What the user last chose, if anything. */
  readonly selectedId: string | undefined;
  readonly origin?: LatLng | undefined;
  /** Settlement the device position resolved to, when the OS could name it. */
  readonly city?: string | undefined;
  readonly customPoint?: CustomPoint | undefined;
};

function chosenSpot({ selectedId, origin, city, customPoint }: SpotSelection): Spot | undefined {
  if (selectedId === undefined) return undefined;
  if (selectedId === CUSTOM_SPOT_ID) {
    return customPoint === undefined ? undefined : customSpot(customPoint);
  }
  if (selectedId === CURRENT_LOCATION_SPOT_ID) {
    return origin === undefined ? undefined : currentLocationSpot(origin, city);
  }
  return SPOTS.find((spot) => spot.id === selectedId);
}

/**
 * The water to forecast for: an explicit choice first, then the device's own
 * position, and the bundled default last so a refused permission still leaves a
 * working app. A selection that no longer resolves falls through the same way.
 */
export function resolveSpot(selection: SpotSelection): Spot {
  const chosen = chosenSpot(selection);
  if (chosen !== undefined) return chosen;
  if (selection.origin === undefined) return DEFAULT_SPOT;
  return currentLocationSpot(selection.origin, selection.city);
}

export type SpotWithDistance = Spot & {
  /** Kilometres from the reference point, or `undefined` without one. */
  distanceKm: number | undefined;
};

function measure(spot: Spot, origin: LatLng | undefined): SpotWithDistance {
  return {
    ...spot,
    distanceKm: origin === undefined ? undefined : distanceKm(origin, spot.coordinates),
  };
}

/**
 * What to offer as "nearby": a point the user picked first, then the device's
 * position, then catalogue waters within reach, closest first. Far from the
 * catalogue this is just the picked point and the position — which is the point.
 */
export function spotsNear(
  origin: LatLng | undefined,
  customPoint?: CustomPoint | undefined,
): SpotWithDistance[] {
  const picked = customPoint === undefined ? [] : [measure(customSpot(customPoint), origin)];
  if (origin === undefined) {
    return [...picked, ...SPOTS.map((spot) => measure(spot, undefined))];
  }

  const catalogue = SPOTS.map((spot) => measure(spot, origin))
    .filter((spot) => (spot.distanceKm ?? Number.POSITIVE_INFINITY) <= NEARBY_RADIUS_KM)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return [...picked, measure(currentLocationSpot(origin), origin), ...catalogue];
}

/** Catalogue lookup by id, falling back to the bundled default. */
export function spotById(id: string | undefined): Spot {
  return SPOTS.find((spot) => spot.id === id) ?? DEFAULT_SPOT;
}
