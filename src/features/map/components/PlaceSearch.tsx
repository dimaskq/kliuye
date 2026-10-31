import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { CustomPoint } from '@/domain/spots';
import type { Place } from '@/services/geocoding';
import {
  Button,
  Card,
  Icon,
  TextField,
  Text,
  iconSize,
  screenPadding,
  space,
  MIN_TOUCH_SIZE,
  useColors,
} from '@/ui';

import { useFindPlace, usePlaceSearch } from '../usePlaceSearch';

export type PlaceSearchProps = {
  onPick: (point: CustomPoint) => void;
};

/** Above the pins, the hint and the point actions. */
const RESULTS_Z = 2000;

function toPoint(place: Place): CustomPoint {
  return { ...place.coordinates, label: place.name };
}

function PlaceRow({ place, onPick }: { place: Place; onPick: PlaceSearchProps['onPick'] }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${place.context}`}
      onPress={() => onPick(toPoint(place))}
      style={{
        minHeight: MIN_TOUCH_SIZE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xl,
        paddingVertical: space.xl,
        paddingHorizontal: space.xxl,
      }}
    >
      <Icon name="map-pin" size={iconSize.header} color={colors.accent} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="rowTitle">{place.name}</Text>
        <Text variant="metaSm" color={colors.textAlpha[55]} numberOfLines={1}>
          {place.context}
        </Text>
      </View>
    </Pressable>
  );
}

function Notice({ text }: { text: string }): React.JSX.Element {
  const colors = useColors();
  return (
    <Card radiusToken="tipCard" elevated style={{ padding: space.xxl }}>
      <Text variant="metaSm" color={colors.textAlpha[60]}>
        {text}
      </Text>
    </Card>
  );
}

function Results({
  query,
  onPick,
}: { query: string } & PlaceSearchProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { places, isSearching, isEmpty, isOffline } = usePlaceSearch(query);

  if (isSearching) return <Notice text={t('common.loading')} />;
  if (isOffline) return <Notice text={t('map.searchOffline')} />;
  if (isEmpty) return <Notice text={t('map.searchEmpty')} />;
  if (places.length === 0) return null;

  return (
    <Card radiusToken="tipCard" elevated style={{ paddingVertical: space.sm }}>
      {places.map((place) => (
        <PlaceRow key={place.id} place={place} onPick={onPick} />
      ))}
    </Card>
  );
}

export type PlaceResultsProps = { query: string } & PlaceSearchProps;

/**
 * The drop-down of matches. It is drawn inside the map's own frame, over the
 * map, rather than hanging off the search field: Android hands a touch only to
 * views inside their parent's bounds, so a list spilling out of the header let
 * a tap on a town fall through to the map and drop a pin beneath it.
 */
export function PlaceResults({ query, onPick }: PlaceResultsProps): React.JSX.Element | null {
  if (query.trim() === '') return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: space.md,
        left: screenPadding.standard.paddingHorizontal,
        right: screenPadding.standard.paddingHorizontal,
        zIndex: RESULTS_Z,
        elevation: RESULTS_Z,
      }}
    >
      <Results query={query} onPick={onPick} />
    </View>
  );
}

export type PlaceSearchFieldProps = {
  query: string;
  onChange: (query: string) => void;
} & PlaceSearchProps;

/** Find a settlement anywhere in the world and forecast for it. */
export function PlaceSearchField({
  query,
  onChange,
  onPick,
}: PlaceSearchFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const findPlace = useFindPlace();

  const find = (): void => {
    void findPlace(query).then((place) => {
      if (place !== undefined) onPick(toPoint(place));
    });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <TextField
          value={query}
          placeholder={t('map.searchPlaceholder')}
          accessibilityLabel={t('map.searchLabel')}
          onChange={onChange}
          onSubmit={find}
        />
      </View>
      <Button label={t('map.searchButton')} onPress={find} />
    </View>
  );
}
