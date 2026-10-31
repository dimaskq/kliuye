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
  useWaterAround,
  usePickPoint,
  useSpotLabel,
  useTilePrefetch,
} from '@/hooks';
import { usePoints, useSelection } from '@/store';
import { Text, radius, screenPadding, space, useColors } from '@/ui';

import {
  MapHeader,
  MapLayerPicker,
  OVERLAY_Z,
  PlaceResults,
  PlaceSearchField,
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
  const selectedId = selectedSpotId ?? nearby[0]?.id ?? '';
  const chosen = nearby.find((spot) => spot.id === selectedId);
  const around = useWaterAround(chosen ?? { id: '', coordinates: { latitude: 0, longitude: 0 } });
  const onLand = around?.water === false;
  /* Out at sea the selected pin scores a carp as 0, the way Today does. */
  const scored = useSpotScores(nearby, speciesId, selectedHour, {
    spotId: selectedId,
    freshwaterNearby: around?.fresh,
  });
  /* A pin on land carries no number: there is no bite to forecast there. */
  const spots = useMemo(
    () =>
      onLand
        ? scored.map((spot) => (spot.id === selectedId ? { ...spot, value: undefined } : spot))
        : scored,
    [onLand, scored, selectedId],
  );
  const selected = spots.find((spot) => spot.id === selectedId);

  useTilePrefetch(usePrefetchAreas(spots, selectedId, favourites));

  return { location, customPoint, setSpot, spots, selectedId, selected, onLand };
}

type MapModel = ReturnType<typeof useMapModel>;

const BELOW_ATTRIBUTION = space.gap * 2 + space.md;

/** Until a pin is down, the map says what a tap on it does; on land, that it missed the water. */
function PickHint({ text }: { text: string }): React.JSX.Element {
  const colors = useColors();
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        /* Below the map's attribution line, which sits in the top corner. */
        top: BELOW_ATTRIBUTION,
        alignSelf: 'center',
        zIndex: OVERLAY_Z,
        backgroundColor: colors.ink,
        borderRadius: radius.pill,
        paddingVertical: space.sm,
        paddingHorizontal: space.xxl,
      }}
    >
      <Text variant="emphasisSm" color={colors.onInk}>
        {text}
      </Text>
    </View>
  );
}

type TopBarProps = {
  onFocusPin: () => void;
  onOpenPlaces: () => void;
  search: PlaceSearchState;
};

function TopBar({ onFocusPin, onOpenPlaces, search }: TopBarProps): React.JSX.Element {
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
      <PlaceSearchField query={search.query} onChange={search.setQuery} onPick={search.pick} />
    </View>
  );
}

/** The search text, shared by the field in the header and the list over the map. */
function usePlaceSearchState() {
  const choosePoint = useChoosePoint();
  const [query, setQuery] = useState('');
  const pick = (point: CustomPoint): void => {
    setQuery('');
    choosePoint(point);
  };
  return { query, setQuery, pick, open: query.trim() !== '' };
}

type PlaceSearchState = ReturnType<typeof usePlaceSearchState>;

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
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pickPoint = usePickPoint();
  const model = useMapModel();
  const actions = useMapDialogs(model.customPoint);
  const [focusRequest, setFocusRequest] = useState(0);
  const search = usePlaceSearchState();
  const pinned = model.selectedId === CUSTOM_SPOT_ID && model.customPoint !== undefined;
  /* Nobody needs a route to where they already stand. */
  const routable = model.selected !== undefined && model.selectedId !== CURRENT_LOCATION_SPOT_ID;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <TopBar
        onFocusPin={() => setFocusRequest((count) => count + 1)}
        onOpenPlaces={() => actions.show('places')}
        search={search}
      />
      <View style={{ flex: 1 }}>
        <SpotMap
          spots={model.spots}
          selectedId={model.selectedId}
          onSelect={model.setSpot}
          /* With the list open, a tap on the map only closes it. */
          onPickPoint={search.open ? () => search.setQuery('') : pickPoint}
          userLocation={model.location.origin}
          focusRequest={focusRequest}
        />
        {model.onLand ? <PickHint text={t('water.noWaterHint')} /> : null}
        {pinned || model.onLand ? null : <PickHint text={t('map.pickHint')} />}
        <PointActions
          onOpen={actions.open}
          onRoute={routable ? () => actions.show('route') : undefined}
          onSave={pinned ? () => actions.show('save') : undefined}
        />
        <MapLayerPicker />
        <PlaceResults query={search.query} onPick={search.pick} />
      </View>
      <Dialogs model={model} actions={actions} />
    </View>
  );
}
