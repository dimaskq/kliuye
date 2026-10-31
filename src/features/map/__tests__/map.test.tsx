import * as MapLibre from '@maplibre/maplibre-react-native';
import { onlineManager } from '@tanstack/react-query';

import type { LatLng } from '@/domain/geo';
import { spotsNear } from '@/domain/spots';
import { useLocation, usePreferences } from '@/store';
import { lightColors } from '@/ui';
import { fireEvent, renderWithProviders, screen } from '@tests/render';

import { MapLayerPicker, SpotMap } from '../components';
import { ONLINE_STYLE, fromLngLat, offlineStyle, toLngLat } from '../components/mapStyle';

const spots = spotsNear(undefined).map((spot, index) => ({ ...spot, value: 60 - index }));
const initialLocation = useLocation.getState();

beforeEach(() => {
  jest.useRealTimers();
  useLocation.setState(initialLocation, true);
});
afterEach(() => onlineManager.setOnline(true));

const commands = (MapLibre as unknown as { __commands: Record<string, jest.Mock> }).__commands;
const LAKE = spots[0]?.coordinates ?? { latitude: 50.62, longitude: 30.48 };
/* A few kilometres from the water, and then a different sea entirely. */
const NEARBY = { latitude: LAKE.latitude + 0.05, longitude: LAKE.longitude + 0.05 };
const FAR = { latitude: 43.21, longitude: 27.91 };

function mapElement(userLocation: LatLng | undefined, focusRequest = 0, onPickPoint = jest.fn()) {
  return (
    <SpotMap
      spots={spots}
      selectedId="s1"
      onSelect={jest.fn()}
      onPickPoint={onPickPoint}
      userLocation={userLocation}
      focusRequest={focusRequest}
    />
  );
}

function renderMap(userLocation: LatLng | undefined) {
  return renderWithProviders(mapElement(userLocation));
}

const theMap = () => screen.getByLabelText('Мапа водойм');

describe('SpotMap', () => {
  it('draws free OpenFreeMap tiles online, with their credit', async () => {
    await renderMap(undefined);
    expect(theMap()).toHaveProp('mapStyle', ONLINE_STYLE);
    expect(screen.getByText('© OpenFreeMap © OpenMapTiles © OpenStreetMap')).toBeOnTheScreen();
  });

  it('draws the saved vector tiles when there is no connection, never OSM raster', async () => {
    onlineManager.setOnline(false);
    await renderMap(undefined);

    const style = theMap().props.mapStyle as ReturnType<typeof offlineStyle>;
    expect(style.sources['openmaptiles']).toMatchObject({ type: 'vector' });
    expect(JSON.stringify(style)).not.toContain('tile.openstreetmap.org');
    expect(screen.getByText('© OpenFreeMap © OpenMapTiles © OpenStreetMap')).toBeOnTheScreen();
  });

  it('takes a tap as the point to forecast for', async () => {
    const onPickPoint = jest.fn();
    await renderWithProviders(mapElement(undefined, 0, onPickPoint));
    theMap().props.onPress({ nativeEvent: { lngLat: [27.9, 43.2] } });
    expect(onPickPoint).toHaveBeenCalledWith({ latitude: 43.2, longitude: 27.9 });
  });

  it('frames the angler and the water together when both are in reach', async () => {
    await renderMap(NEARBY);
    expect(commands.fitBounds).toHaveBeenCalledWith(
      [LAKE.longitude, LAKE.latitude, NEARBY.longitude, NEARBY.latitude],
      expect.objectContaining({ duration: expect.any(Number) }),
    );
  });

  it('keeps the water centred when the angler is half a country away', async () => {
    await renderMap(FAR);
    expect(commands.fitBounds).not.toHaveBeenCalled();
    expect(commands.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: toLngLat(LAKE) }),
    );
  });

  it('closes in on the selected pin each time it is asked to, and only then', async () => {
    const view = await renderMap(FAR);
    commands.easeTo?.mockClear();

    await view.rerender(mapElement(FAR, 1));
    expect(commands.easeTo).toHaveBeenCalledTimes(1);
    expect(commands.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: toLngLat(LAKE), zoom: 14 }),
    );

    await view.rerender(mapElement(FAR, 1));
    expect(commands.easeTo).toHaveBeenCalledTimes(1);
  });
});

describe('map views', () => {
  afterEach(() => usePreferences.getState().setMapLayer('standard'));

  it('draws the light and dark views from OpenFreeMap', async () => {
    usePreferences.getState().setMapLayer('dark');
    await renderMap(undefined);
    expect(theMap()).toHaveProp('mapStyle', 'https://tiles.openfreemap.org/styles/dark');
  });

  it('shades the relief from open elevation tiles, under the water and roads', async () => {
    usePreferences.getState().setMapLayer('terrain');
    await renderMap(undefined);
    expect(theMap()).toHaveProp('mapStyle', ONLINE_STYLE);
    expect(screen.getByText(/Terrain © Mapzen/)).toBeOnTheScreen();
  });

  it('keeps no relief offline, where only the saved plain map exists', async () => {
    usePreferences.getState().setMapLayer('terrain');
    onlineManager.setOnline(false);
    await renderMap(undefined);
    expect(screen.queryByText(/Terrain © Mapzen/)).toBeNull();
  });

  it('lets the angler pick the view from the layer button, and remembers it', async () => {
    await renderWithProviders(<MapLayerPicker />);
    await fireEvent.press(screen.getByRole('button', { name: 'Вигляд мапи' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Рельєф' }));
    expect(usePreferences.getState().mapLayer).toBe('terrain');
  });
});

describe('map coordinates', () => {
  it('round-trips between the app and MapLibre orders', () => {
    expect(fromLngLat(toLngLat(LAKE))).toEqual(LAKE);
    expect(toLngLat({ latitude: 1, longitude: 2 })).toEqual([2, 1]);
  });

  it('reads offline tiles from the cache folder, however it is spelled', () => {
    const style = offlineStyle('file:///documents/map-vector/', undefined, lightColors);
    expect(style.sources['openmaptiles']).toMatchObject({
      tiles: ['file:///documents/map-vector/{z}/{x}/{y}'],
    });
  });

  it('keeps the saved style but points it at the saved tiles, dropping other sources', () => {
    const saved = {
      version: 8,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: {
        openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
        ne2_shaded: { type: 'raster', tiles: ['https://example.org/{z}/{x}/{y}.png'] },
      },
      layers: [
        { id: 'background', type: 'background' },
        { id: 'relief', type: 'raster', source: 'ne2_shaded' },
        { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water' },
      ],
    };
    const style = offlineStyle('file:///documents/map-vector', saved, lightColors);

    expect(Object.keys(style.sources)).toEqual(['openmaptiles']);
    expect(style.sources['openmaptiles']).not.toHaveProperty('url');
    expect(style.layers.map((layer) => layer.id)).toEqual(['background', 'water']);
    expect(style.glyphs).toBe(saved.glyphs);
  });
});
