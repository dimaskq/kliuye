import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { CustomPoint } from '@/domain/spots';
import type { Place } from '@/services/geocoding';
import { Button, Card, Icon, TextField, Text, colors, iconSize, space, MIN_TOUCH_SIZE } from '@/ui';

import { useFindPlace, usePlaceSearch } from '../usePlaceSearch';

export type PlaceSearchProps = {
  onPick: (point: CustomPoint) => void;
};

function toPoint(place: Place): CustomPoint {
  return { ...place.coordinates, label: place.name };
}

function PlaceRow({ place, onPick }: { place: Place; onPick: PlaceSearchProps['onPick'] }) {
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

/**
 * Find a settlement anywhere in the world and forecast for it. Results open as
 * a drop-down over whatever sits below, so the map does not jump.
 */
export function PlaceSearch({ onPick }: PlaceSearchProps): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const findPlace = useFindPlace();

  const pick = (point: CustomPoint): void => {
    setQuery('');
    onPick(point);
  };

  const find = (): void => {
    void findPlace(query).then((place) => {
      if (place !== undefined) pick(toPoint(place));
    });
  };

  return (
    <View style={{ zIndex: 10, elevation: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField
            value={query}
            placeholder={t('map.searchPlaceholder')}
            accessibilityLabel={t('map.searchLabel')}
            onChange={setQuery}
            onSubmit={find}
          />
        </View>
        <Button label={t('map.searchButton')} onPress={find} />
      </View>
      <View style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: space.md }}>
        <Results query={query} onPick={pick} />
      </View>
    </View>
  );
}
