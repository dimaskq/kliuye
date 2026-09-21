import type { CameraRef, LngLatBounds } from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';

import { distanceKm } from '@/domain/geo';
import type { LatLng } from '@/domain/geo';

import { toLngLat } from './mapStyle';

/** Roughly a 40 km view: the water and its surroundings. */
export const OVERVIEW_ZOOM = 10;
/** Close enough to see the bank the pin stands on. */
const FOCUS_ZOOM = 14;
const MOVE_MS = 450;
/**
 * Beyond this the two points have nothing to say to each other: fitting a
 * fishing spot and an angler 300 km apart into one frame shows a country.
 */
const FIT_TOGETHER_KM = 80;
const FIT_PADDING = 90;

/** The smallest box holding both points, as [west, south, east, north]. */
function boundsAround(a: LatLng, b: LatLng): LngLatBounds {
  return [
    Math.min(a.longitude, b.longitude),
    Math.min(a.latitude, b.latitude),
    Math.max(a.longitude, b.longitude),
    Math.max(a.latitude, b.latitude),
  ];
}

/**
 * Keeps the water in view — and the angler too, when both fit: seeing the pin
 * and one's own dot at once is what makes "how do I get there" a real question.
 */
export function useRecentre(
  camera: React.RefObject<CameraRef | null>,
  centre: LatLng | undefined,
  userLocation: LatLng | undefined,
): void {
  /* Coordinates travel as numbers so the effect depends on values, not objects. */
  const latitude = centre?.latitude;
  const longitude = centre?.longitude;
  const fromLatitude = userLocation?.latitude;
  const fromLongitude = userLocation?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const water = { latitude, longitude };
    const angler =
      fromLatitude === undefined || fromLongitude === undefined
        ? undefined
        : { latitude: fromLatitude, longitude: fromLongitude };

    if (angler !== undefined && distanceKm(angler, water) <= FIT_TOGETHER_KM) {
      camera.current?.fitBounds(boundsAround(water, angler), {
        padding: { top: FIT_PADDING, right: FIT_PADDING, bottom: FIT_PADDING, left: FIT_PADDING },
        duration: MOVE_MS,
      });
      return;
    }
    camera.current?.easeTo({ center: toLngLat(water), zoom: OVERVIEW_ZOOM, duration: MOVE_MS });
  }, [camera, fromLatitude, fromLongitude, latitude, longitude]);
}

/** "Show me the pin": close in on it, whatever the angler has panned to. */
export function useFocus(
  camera: React.RefObject<CameraRef | null>,
  centre: LatLng | undefined,
  request: number,
): void {
  /* Only a new request zooms; the pin moving on its own must not. */
  const handled = useRef(request);
  const latitude = centre?.latitude;
  const longitude = centre?.longitude;

  useEffect(() => {
    if (request === handled.current) return;
    handled.current = request;
    if (latitude === undefined || longitude === undefined) return;
    camera.current?.easeTo({
      center: toLngLat({ latitude, longitude }),
      zoom: FOCUS_ZOOM,
      duration: MOVE_MS,
    });
  }, [camera, latitude, longitude, request]);
}
