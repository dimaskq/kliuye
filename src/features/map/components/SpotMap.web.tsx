import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { LatLng } from '@/domain/geo';
import { CUSTOM_SPOT_ID } from '@/domain/spots';
import { TILE_URL_TEMPLATE } from '@/services/tiles';
import { colors } from '@/ui';

import type { ScoredSpot } from '../useSpotScores';

import { cachedTileLayer } from './cachedTiles.web';
import { PIN, pinStyle, pinSvgMarkup } from './pinShape';
import type { SpotMapProps } from './SpotMap';

const ZOOM = 9;
const FOCUS_ZOOM = 14;
const USER_DOT_RADIUS = 7;
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const MAX_ZOOM = 18;

function pinIcon(spot: ScoredSpot, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [PIN.width, PIN.height],
    /* The tip, not the centre, sits on the coordinate. */
    iconAnchor: [PIN.width / 2, PIN.height],
    html: pinSvgMarkup(spot.value, pinStyle(selected, spot.id === CUSTOM_SPOT_ID)),
  });
}

type Handlers = {
  select: (id: string) => void;
  pick: (coordinates: LatLng) => void;
};

/** Handlers change identity every render; markers must not be rebuilt for that. */
function useHandlers(onSelect: (id: string) => void, onPickPoint: (c: LatLng) => void) {
  const handlers = useRef<Handlers>({ select: onSelect, pick: onPickPoint });
  useEffect(() => {
    handlers.current = { select: onSelect, pick: onPickPoint };
  }, [onPickPoint, onSelect]);
  return handlers;
}

/** The angler's own position: the browser's answer to the native blue dot. */
function useUserDot(map: React.RefObject<L.Map | null>, userLocation: LatLng | undefined): void {
  const { t } = useTranslation();
  const dot = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    const instance = map.current;
    if (instance === null) return;

    if (userLocation === undefined) {
      dot.current?.remove();
      dot.current = null;
      return;
    }

    const position: L.LatLngExpression = [userLocation.latitude, userLocation.longitude];
    if (dot.current === null) {
      dot.current = L.circleMarker(position, {
        radius: USER_DOT_RADIUS,
        color: colors.white,
        weight: 2,
        fillColor: colors.accent2,
        fillOpacity: 1,
      })
        .bindTooltip(t('map.youAreHere'))
        .addTo(instance);
      return;
    }
    dot.current.setLatLng(position);
  }, [map, t, userLocation]);
}

function useLeafletMap(handlers: React.RefObject<Handlers>) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (container.current === null || map.current !== null) return;
    const element = container.current;
    const instance = L.map(element).setView([0, 0], ZOOM);
    cachedTileLayer(TILE_URL_TEMPLATE, { attribution: ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(
      instance,
    );
    /* Leaflet caches the viewport size; resizing the sheet has to tell it. */
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(element);
    instance.on('click', (event: L.LeafletMouseEvent) =>
      handlers.current.pick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
    );
    map.current = instance;
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, [handlers]);

  return { container, map };
}

/** "Show me the pin": close in on it, whatever the angler has panned to. */
function useFocus(
  map: React.RefObject<L.Map | null>,
  centre: ScoredSpot | undefined,
  focusRequest: number,
): void {
  /* Only a new request zooms; the pin moving on its own must not. */
  const handledFocus = useRef(focusRequest);
  useEffect(() => {
    if (focusRequest === handledFocus.current || centre === undefined) return;
    handledFocus.current = focusRequest;
    map.current?.setView([centre.coordinates.latitude, centre.coordinates.longitude], FOCUS_ZOOM);
  }, [centre, focusRequest, map]);
}

/**
 * The browser preview uses Leaflet on OpenStreetMap tiles: no API key and no
 * billing, at the cost of the attribution OSM requires. Tiles go through the
 * shared cache, so the preview keeps drawing offline. Native builds use
 * MapLibre — see SpotMap.tsx.
 */
export function SpotMap({
  spots,
  selectedId,
  onSelect,
  onPickPoint,
  userLocation,
  focusRequest = 0,
}: SpotMapProps): React.JSX.Element {
  const handlers = useHandlers(onSelect, onPickPoint);
  const { container, map } = useLeafletMap(handlers);
  useUserDot(map, userLocation);
  const markers = useRef(new Map<string, L.Marker>());
  const dragging = useRef(false);
  const centre = spots.find((spot) => spot.id === selectedId) ?? spots[0];

  useEffect(() => {
    const instance = map.current;
    if (instance === null) return;

    for (const spot of spots) {
      const position: L.LatLngExpression = [spot.coordinates.latitude, spot.coordinates.longitude];
      const icon = pinIcon(spot, spot.id === selectedId);
      const existing = markers.current.get(spot.id);
      if (existing !== undefined) {
        existing.setIcon(icon);
        /* Never snap a pin back to props while the user is still holding it. */
        if (!dragging.current) existing.setLatLng(position);
        continue;
      }
      markers.current.set(
        spot.id,
        createMarker(spot, position, icon, instance, handlers, dragging),
      );
    }

    const live = new Set(spots.map((spot) => spot.id));
    for (const [id, marker] of markers.current) {
      if (live.has(id)) continue;
      marker.remove();
      markers.current.delete(id);
    }
  }, [handlers, map, selectedId, spots]);

  useEffect(() => {
    if (centre === undefined || dragging.current) return;
    map.current?.setView([centre.coordinates.latitude, centre.coordinates.longitude], ZOOM);
  }, [centre, map]);

  useFocus(map, centre, focusRequest);

  return <div ref={container} style={{ height: '100%', background: colors.surface }} />;
}

function createMarker(
  spot: ScoredSpot,
  position: L.LatLngExpression,
  icon: L.DivIcon,
  instance: L.Map,
  handlers: React.RefObject<Handlers>,
  dragging: React.RefObject<boolean>,
): L.Marker {
  const draggable = spot.id === CUSTOM_SPOT_ID;
  const marker = L.marker(position, { icon, keyboard: true, title: spot.id, draggable });

  marker.on('click', (event: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(event);
    handlers.current.select(spot.id);
  });

  if (draggable) {
    marker.on('dragstart', () => {
      dragging.current = true;
    });
    marker.on('dragend', () => {
      dragging.current = false;
      const { lat, lng } = marker.getLatLng();
      handlers.current.pick({ latitude: lat, longitude: lng });
    });
  }

  return marker.addTo(instance);
}
