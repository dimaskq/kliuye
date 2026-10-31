import type L from 'leaflet';
import { useEffect, useRef } from 'react';

import type { MapLayer } from '@/store';

import { cachedTileLayer } from './cachedTiles.web';

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

type WebLayer = {
  url: string;
  attribution: string;
  maxZoom: number;
  /** A CSS filter over the tiles, so one tile source gives several looks. */
  filter?: string;
};

/**
 * The browser preview only — a phone never asks these servers for tiles. Raster
 * stand-ins for the phone's looks: plain, relief, light and dark.
 *
 * Light and dark are the OpenStreetMap tiles themselves, filtered in the
 * browser: CARTO's light and dark basemaps, the usual choice, now answer every
 * tile with "API key required".
 */
const WEB_LAYERS: Readonly<Record<MapLayer, WebLayer>> = {
  standard: { url: OSM_TILES, attribution: OSM, maxZoom: 18 },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: `${OSM}, SRTM · <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`,
    maxZoom: 17,
  },
  light: {
    url: OSM_TILES,
    attribution: OSM,
    maxZoom: 18,
    filter: 'grayscale(0.85) brightness(1.08) contrast(0.85)',
  },
  dark: {
    url: OSM_TILES,
    attribution: OSM,
    maxZoom: 18,
    filter: 'invert(1) hue-rotate(180deg) grayscale(0.4) brightness(0.9) contrast(0.9)',
  },
};

/** Swaps the tile layer whenever the angler picks another look. */
export function useTileLayer(map: React.RefObject<L.Map | null>, layer: MapLayer): void {
  const tiles = useRef<L.TileLayer | null>(null);
  useEffect(() => {
    const instance = map.current;
    if (instance === null) return;
    const { url, attribution, maxZoom, filter } = WEB_LAYERS[layer];
    tiles.current?.remove();
    const next = cachedTileLayer(url, { attribution, maxZoom }).addTo(instance);
    /* The pane holding the tiles, not the markers above them, takes the filter. */
    const pane = next.getContainer();
    if (pane !== null) pane.style.filter = filter ?? '';
    tiles.current = next;
  }, [layer, map]);
}
