import { Camera, Map as MapLibreMap, Marker } from '@maplibre/maplibre-react-native';
import type { CameraRef, LngLat } from '@maplibre/maplibre-react-native';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';

import type { LatLng } from '@/domain/geo';
import { useIsOnline } from '@/hooks';
import { tileCachePath } from '@/services/tiles';
import { Text, colors, radius, space } from '@/ui';

import type { ScoredSpot } from '../useSpotScores';

import { MapPin } from './MapPin';
import {
  OFFLINE_ATTRIBUTION,
  ONLINE_ATTRIBUTION,
  ONLINE_STYLE,
  fromLngLat,
  offlineStyle,
  toLngLat,
} from './mapStyle';
import { OVERVIEW_ZOOM, useFocus, useRecentre } from './useMapCamera';

export type SpotMapProps = {
  spots: readonly ScoredSpot[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** A tap anywhere on the map chooses that point. */
  onPickPoint: (coordinates: LatLng) => void;
  /** The device's own position, when it is known and the angler allowed it. */
  userLocation?: LatLng | undefined;
  /** Each new value zooms in on the selected pin; 0 means never asked. */
  focusRequest?: number;
};

type LngLatEvent = NativeSyntheticEvent<{ lngLat: LngLat }>;

const USER_DOT = 16;

type SpotPinProps = {
  spot: ScoredSpot;
  selected: boolean;
  onSelect: () => void;
};

/**
 * Pins are live views on the map. Moving the picked point is a tap elsewhere:
 * MapLibre drags only bitmap annotations, and those cannot draw the SVG pin.
 */
function SpotPin({ spot, selected, onSelect }: SpotPinProps): React.JSX.Element {
  return (
    <Marker id={spot.id} lngLat={toLngLat(spot.coordinates)} anchor="bottom" onPress={onSelect}>
      <MapPin value={spot.value} selected={selected} />
    </Marker>
  );
}

/** The angler's own position, drawn from what the app already knows. */
function UserDot({ at }: { at: LatLng }): React.JSX.Element {
  return (
    <Marker id="user-location" lngLat={toLngLat(at)}>
      <View
        style={{
          width: USER_DOT,
          height: USER_DOT,
          borderRadius: radius.pill,
          backgroundColor: colors.accent2,
          borderWidth: 3,
          borderColor: colors.white,
        }}
      />
    </Marker>
  );
}

type PinsProps = Pick<SpotMapProps, 'spots' | 'selectedId' | 'onSelect' | 'userLocation'>;

function Pins({ spots, selectedId, onSelect, userLocation }: PinsProps): React.JSX.Element {
  return (
    <>
      {userLocation === undefined ? null : <UserDot at={userLocation} />}
      {spots.map((spot) => (
        /* A new index or selection mounts a fresh view rather than reusing a stale one. */
        <SpotPin
          key={`${spot.id}:${spot.value ?? ''}:${spot.id === selectedId}`}
          spot={spot}
          selected={spot.id === selectedId}
          onSelect={() => onSelect(spot.id)}
        />
      ))}
    </>
  );
}

/** The map's data sources ask for credit wherever their tiles are drawn. */
function Attribution({ text }: { text: string }): React.JSX.Element {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: space.sm,
        top: space.sm,
        backgroundColor: colors.neutral[100],
        borderRadius: radius.pill,
        paddingVertical: space.xxs,
        paddingHorizontal: space.md,
      }}
    >
      <Text variant="caption" color={colors.textAlpha[68]}>
        {text}
      </Text>
    </View>
  );
}

/** Online vector maps, or the tiles saved on the device when there is no signal. */
function useMapStyle(online: boolean) {
  return useMemo(() => {
    const cache = online ? undefined : tileCachePath();
    return cache === undefined
      ? { style: ONLINE_STYLE, credit: ONLINE_ATTRIBUTION }
      : { style: offlineStyle(cache), credit: OFFLINE_ATTRIBUTION };
  }, [online]);
}

/**
 * MapLibre on OpenFreeMap vector tiles — free, with no key and no account —
 * with our own pins on top. Offline it draws the OpenStreetMap tiles the app
 * prefetched for this area while it still had a connection.
 */
export function SpotMap({
  spots,
  selectedId,
  onSelect,
  onPickPoint,
  userLocation,
  focusRequest = 0,
}: SpotMapProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const camera = useRef<CameraRef>(null);
  const { style, credit } = useMapStyle(useIsOnline());
  const centre = spots.find((spot) => spot.id === selectedId) ?? spots[0];
  /* Android places marker views against the loaded map; ones added earlier stick at the corner. */
  const [loaded, setLoaded] = useState(false);

  useRecentre(camera, centre?.coordinates, userLocation);
  useFocus(camera, centre?.coordinates, focusRequest);

  if (centre === undefined) return null;

  return (
    /* Clipped: marker views for waters north of the frame must not spill over the header. */
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <MapLibreMap
        style={{ flex: 1 }}
        mapStyle={style}
        accessibilityLabel={t('map.placeholder')}
        accessibilityHint={t('map.pickHint')}
        attribution={false}
        logo={false}
        compass={false}
        scaleBar={false}
        touchPitch={false}
        /* A TextureView composes with the views around it; a SurfaceView made
           neighbouring rounded shapes (the active tab) lose their corners. */
        androidView="texture"
        onPress={(event: LngLatEvent) => onPickPoint(fromLngLat(event.nativeEvent.lngLat))}
        onDidFinishLoadingMap={() => setLoaded(true)}
      >
        <Camera
          ref={camera}
          initialViewState={{ center: toLngLat(centre.coordinates), zoom: OVERVIEW_ZOOM }}
        />
        {loaded ? (
          <Pins
            spots={spots}
            selectedId={selectedId}
            onSelect={onSelect}
            userLocation={userLocation}
          />
        ) : null}
      </MapLibreMap>
      <Attribution text={credit} />
    </View>
  );
}
