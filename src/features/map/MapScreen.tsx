import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LatLng } from '@/domain/geo';
import { CURRENT_LOCATION_SPOT_ID, CUSTOM_SPOT_ID, spotsNear } from '@/domain/spots';
import type { CustomPoint } from '@/domain/spots';
import {
  useChoosePoint,
  useDeviceLocation,
  usePickPoint,
  useSpotLabel,
  useTilePrefetch,
} from '@/hooks';
import { usePoints, useSelection } from '@/store';
import { Text, colors, radius, screenPadding, space } from '@/ui';

import {
  MapHeader,
  OVERLAY_Z,
  PlaceSearch,
  PlacesDialog,
  PointActions,
  RouteDialog,
  SavePointDialog,
  SpotMap,
} from './components';
import { useMapDialogs } from './useMapDialogs';
import type { ScoredSpot } from './useSpotScores';
import { useSpotScores } from './useSpotScores';

/**
 * Opening the map with a connection is what fills the offline map: the water
 * being looked at first, then the ones kept for later.
 */
function usePrefetchAreas(
  spots: readonly ScoredSpot[],
  selectedId: string,
  favourites: readonly CustomPoint[],
): readonly LatLng[] {
  return useMemo(
    () => [
      ...spots.filter((spot) => spot.id === selectedId).map((spot) => spot.coordinates),
      ...favourites,
    ],
    [favourites, selectedId, spots],
  );
}

/** Selection, position and the scored waters — everything the screen reads. */
function useMapModel() {
  const location = useDeviceLocation();
  const { speciesId, selectedHour, selectedSpotId, customPoint, setSpot } = useSelection();
  const favourites = usePoints((state) => state.favourites);

  const nearby = useMemo(
    () => spotsNear(location.origin, customPoint),
    [location.origin, customPoint],
  );
  const spots = useSpotScores(nearby, speciesId, selectedHour);
  const selectedId = selectedSpotId ?? spots[0]?.id ?? '';
  const selected = spots.find((spot) => spot.id === selectedId);

  useTilePrefetch(usePrefetchAreas(spots, selectedId, favourites));

  return { location, customPoint, setSpot, spots, selectedId, selected };
}

type MapModel = ReturnType<typeof useMapModel>;

const BELOW_ATTRIBUTION = space.gap * 2 + space.md;

/** Until a pin is down, the map says what a tap on it does. */
function PickHint(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        /* Below the map's attribution line, which sits in the top corner. */
        top: BELOW_ATTRIBUTION,
        alignSelf: 'center',
        zIndex: OVERLAY_Z,
        backgroundColor: colors.text,
        borderRadius: radius.pill,
        paddingVertical: space.sm,
        paddingHorizontal: space.xxl,
      }}
    >
      <Text variant="emphasisSm" color={colors.bg}>
        {t('map.pickHint')}
      </Text>
    </View>
  );
}

type TopBarProps = { onFocusPin: () => void; onOpenPlaces: () => void };

function TopBar({ onFocusPin, onOpenPlaces }: TopBarProps): React.JSX.Element {
  const choosePoint = useChoosePoint();
  return (
    <View
      style={{
        zIndex: OVERLAY_Z,
        gap: space.xl,
        paddingHorizontal: screenPadding.standard.paddingHorizontal,
        paddingTop: space.md,
        paddingBottom: space.xl,
      }}
    >
      <MapHeader onFocusPin={onFocusPin} onOpenPlaces={onOpenPlaces} />
      <PlaceSearch onPick={choosePoint} />
    </View>
  );
}

type DialogsProps = { model: MapModel; actions: ReturnType<typeof useMapDialogs> };

function Dialogs({ model, actions }: DialogsProps): React.JSX.Element {
  const labelOf = useSpotLabel();
  const { customPoint, selected } = model;

  return (
    <>
      <SavePointDialog
        visible={actions.dialog === 'save'}
        suggestedName={customPoint?.label ?? ''}
        onCancel={actions.close}
        onConfirm={actions.save}
      />
      {selected === undefined ? null : (
        <RouteDialog
          visible={actions.dialog === 'route'}
          destination={selected.coordinates}
          name={labelOf(selected).name}
          onClose={actions.close}
        />
      )}
      <PlacesDialog visible={actions.dialog === 'places'} onClose={actions.close} />
    </>
  );
}

/** Where to fish: find a place or drop a pin, then open, route to, or keep it. */
export function MapScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const pickPoint = usePickPoint();
  const model = useMapModel();
  const actions = useMapDialogs(model.customPoint);
  const [focusRequest, setFocusRequest] = useState(0);
  const pinned = model.selectedId === CUSTOM_SPOT_ID && model.customPoint !== undefined;
  /* Nobody needs a route to where they already stand. */
  const routable = model.selected !== undefined && model.selectedId !== CURRENT_LOCATION_SPOT_ID;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <TopBar
        onFocusPin={() => setFocusRequest((count) => count + 1)}
        onOpenPlaces={() => actions.show('places')}
      />
      <View style={{ flex: 1 }}>
        <SpotMap
          spots={model.spots}
          selectedId={model.selectedId}
          onSelect={model.setSpot}
          onPickPoint={pickPoint}
          userLocation={model.location.origin}
          focusRequest={focusRequest}
        />
        {pinned ? null : <PickHint />}
        <PointActions
          onOpen={actions.open}
          onRoute={routable ? () => actions.show('route') : undefined}
          onSave={pinned ? () => actions.show('save') : undefined}
        />
      </View>
      <Dialogs model={model} actions={actions} />
    </View>
  );
}
