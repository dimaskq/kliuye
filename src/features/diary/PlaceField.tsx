import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { PLACE_LIMIT } from '@/domain/diary';
import { formatPosition } from '@/domain/spots';
import { PlacesDialog } from '@/features/map';
import { useActiveSpot, useDeviceLocation } from '@/hooks';
import { Icon, Pill, Text, TextField, iconSize, space, useColors } from '@/ui';
import type { IconName } from '@/ui';

import { FormField } from './components';
import { PlaceMapModal } from './components/PlaceMapModal';
import type { CatchFormState } from './useCatchForm';
import { usePlacePicker } from './usePlacePicker';
import type { PlacePicker } from './usePlacePicker';

type Choice = { key: string; icon: IconName; label: string; onPress: () => void };

function Choices({ choices }: { choices: readonly Choice[] }): React.JSX.Element {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: space.md, paddingTop: space.md }}
    >
      {choices.map((choice) => (
        <Pill
          key={choice.key}
          role="button"
          label={choice.label}
          selected={false}
          accessibilityLabel={choice.label}
          leading={<Icon name={choice.icon} size={iconSize.inline} color={colors.accent} />}
          onPress={choice.onPress}
        />
      ))}
    </ScrollView>
  );
}

function PlaceChoices({ picker }: { picker: PlacePicker }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Choices
      choices={[
        {
          key: 'map',
          icon: 'map-pin',
          label: t('diary.placeOnMap'),
          onPress: () => picker.show('map'),
        },
        {
          key: 'here',
          icon: 'footprints',
          label: picker.locating ? t('diary.placeLocating') : t('diary.placeHere'),
          onPress: picker.fromHere,
        },
        {
          key: 'saved',
          icon: 'star',
          label: t('diary.placeSaved'),
          onPress: () => picker.show('saved'),
        },
      ]}
    />
  );
}

/** Under the name: which point it stands for, or why the location did not come. */
function Caption({ form, picker }: Pick<CatchFormState, 'form'> & { picker: PlacePicker }) {
  const colors = useColors();
  const { t } = useTranslation();
  const text = picker.locationDenied
    ? t('diary.placeNoLocation')
    : form.coordinates === undefined
      ? undefined
      : t('diary.placePoint', { position: formatPosition(form.coordinates) });
  if (text === undefined) return null;
  return (
    <Text variant="metaSm" color={colors.textAlpha[55]} style={{ marginTop: space.sm }}>
      {text}
    </Text>
  );
}

/**
 * Where it was caught: a name to read, and the point behind it — picked on the
 * map, taken from where the angler stands, or chosen from the saved places.
 */
export function PlaceField({ form, set }: Pick<CatchFormState, 'form' | 'set'>) {
  const { t } = useTranslation();
  const picker = usePlacePicker({ form, set });
  const { spot } = useActiveSpot();
  const { origin } = useDeviceLocation();

  return (
    <FormField label={t('diary.placeLabel')}>
      <TextField
        icon="map-pin"
        value={form.place}
        placeholder={t('diary.placePlaceholder')}
        accessibilityLabel={t('diary.placeLabel')}
        maxLength={PLACE_LIMIT}
        onChange={(value) => set('place', value)}
      />
      <PlaceChoices picker={picker} />
      <Caption form={form} picker={picker} />
      {/* Mounted per opening, so the map starts at the entry's current point. */}
      {picker.open === 'map' ? (
        <PlaceMapModal
          visible
          initial={form.coordinates ?? spot.coordinates}
          userLocation={origin}
          onDone={picker.fromMap}
          onClose={picker.close}
        />
      ) : null}
      <PlacesDialog
        visible={picker.open === 'saved'}
        onClose={picker.close}
        onChoose={picker.fromSaved}
      />
    </FormField>
  );
}
