import type { LngLat, StyleSpecification } from '@maplibre/maplibre-react-native';

import type { LatLng } from '@/domain/geo';
import { MAP_STYLE_URL, TILE_MAX_ZOOM, TILE_MIN_ZOOM, VECTOR_SOURCE } from '@/services/tiles';
import type { MapLayer } from '@/store';
import type { Colors } from '@/ui';

/**
 * OpenFreeMap: free vector maps with no key and no account, built from
 * OpenStreetMap data. Online and offline the map draws the same tiles.
 */
export const ONLINE_STYLE = MAP_STYLE_URL;

export const MAP_ATTRIBUTION = '© OpenFreeMap © OpenMapTiles © OpenStreetMap';

/** OpenFreeMap's other looks; the relief reuses the plain map underneath. */
const LAYER_STYLES: Readonly<Record<MapLayer, string>> = {
  standard: ONLINE_STYLE,
  terrain: ONLINE_STYLE,
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

export function styleFor(layer: MapLayer): string {
  return LAYER_STYLES[layer];
}

/**
 * Elevation for the relief: the Terrain Tiles Mapzen built and AWS hosts as an
 * open dataset — free, keyless, worldwide, PNG-encoded heights ("terrarium").
 */
export const RELIEF_TILES =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
export const RELIEF_MAX_ZOOM = 15;
export const RELIEF_ATTRIBUTION = 'Terrain © Mapzen, AWS';
/** The shading goes under the water, roads and names, over the land cover. */
export const RELIEF_BELOW = 'waterway_tunnel';

export function attributionFor(layer: MapLayer): string {
  return layer === 'terrain' ? `${MAP_ATTRIBUTION} · ${RELIEF_ATTRIBUTION}` : MAP_ATTRIBUTION;
}

type Layer = StyleSpecification['layers'][number];

function isStyle(value: unknown): value is StyleSpecification {
  if (typeof value !== 'object' || value === null) return false;
  const { sources, layers } = value as Partial<StyleSpecification>;
  return typeof sources === 'object' && Array.isArray(layers);
}

function sourceOf(layer: Layer): string | undefined {
  return 'source' in layer && typeof layer.source === 'string' ? layer.source : undefined;
}

/** What the map draws with no saved style: land, water and rivers, unlabelled. */
function bareLayers(colors: Colors): Layer[] {
  return [
    { id: 'ground', type: 'background', paint: { 'background-color': colors.surface } },
    {
      id: 'water',
      type: 'fill',
      source: VECTOR_SOURCE,
      'source-layer': 'water',
      paint: { 'fill-color': '#a0c8f0' },
    },
    {
      id: 'waterway',
      type: 'line',
      source: VECTOR_SOURCE,
      'source-layer': 'waterway',
      paint: { 'line-color': '#a0c8f0', 'line-width': 1.5 },
    },
    {
      id: 'roads',
      type: 'line',
      source: VECTOR_SOURCE,
      'source-layer': 'transportation',
      paint: { 'line-color': colors.white, 'line-width': 1.5 },
    },
  ];
}

/**
 * Without a connection the map is drawn from the vector tiles saved on the
 * device, in the style saved with them — the same map the angler saw online.
 * Every other source in the style (the shaded relief of the world view) is
 * left out rather than drawn as a hole. Beyond the deepest saved zoom MapLibre
 * draws the last tile larger, which vector tiles survive without blurring.
 */
export function offlineStyle(
  tileCacheUri: string,
  saved: unknown,
  colors: Colors,
): StyleSpecification {
  const vector = {
    type: 'vector' as const,
    tiles: [`${tileCacheUri.replace(/\/+$/, '')}/{z}/{x}/{y}`],
    minzoom: TILE_MIN_ZOOM,
    maxzoom: TILE_MAX_ZOOM,
  };

  if (!isStyle(saved)) {
    return { version: 8, sources: { [VECTOR_SOURCE]: vector }, layers: bareLayers(colors) };
  }

  return {
    ...saved,
    sources: { [VECTOR_SOURCE]: vector },
    layers: saved.layers.filter((layer) => {
      const source = sourceOf(layer);
      return source === undefined || source === VECTOR_SOURCE;
    }),
  };
}

/** MapLibre speaks [longitude, latitude]; the app speaks { latitude, longitude }. */
export function toLngLat({ latitude, longitude }: LatLng): LngLat {
  return [longitude, latitude];
}

export function fromLngLat([longitude, latitude]: LngLat): LatLng {
  return { latitude, longitude };
}
