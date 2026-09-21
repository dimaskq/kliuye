import * as MapLibre from '@maplibre/maplibre-react-native';
import { onlineManager } from '@tanstack/react-query';

import type { LatLng } from '@/domain/geo';
import { spotsNear } from '@/domain/spots';
import { useLocation } from '@/store';
import { renderWithProviders, screen } from '@tests/render';

import { SpotMap } from '../components';
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

  it('draws the saved OpenStreetMap tiles when there is no connection', async () => {
    onlineManager.setOnline(false);
    await renderMap(undefined);

    const style = theMap().props.mapStyle as ReturnType<typeof offlineStyle>;
    expect(style.sources['saved']).toMatchObject({ type: 'raster' });
    expect(screen.getByText('© OpenStreetMap')).toBeOnTheScreen();
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

describe('map coordinates', () => {
  it('round-trips between the app and MapLibre orders', () => {
    expect(fromLngLat(toLngLat(LAKE))).toEqual(LAKE);
    expect(toLngLat({ latitude: 1, longitude: 2 })).toEqual([2, 1]);
  });

  it('reads offline tiles from the cache folder, however it is spelled', () => {
    const style = offlineStyle('file:///documents/map-tiles/');
    expect(style.sources['saved']).toMatchObject({
      tiles: ['file:///documents/map-tiles/{z}/{x}/{y}'],
    });
  });
});
