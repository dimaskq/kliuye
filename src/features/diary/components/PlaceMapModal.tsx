import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LatLng } from '@/domain/geo';
import { CUSTOM_SPOT_ID, customSpot } from '@/domain/spots';
import { SpotMap } from '@/features/map';
import { Button, IconButton, Text, space, MIN_TOUCH_SIZE, useColors } from '@/ui';

export type PlaceMapModalProps = {
  visible: boolean;
  /** Where the map opens: the entry's own point, or the water in view. */
  initial: LatLng;
  userLocation: LatLng | undefined;
  onDone: (point: LatLng) => void;
  onClose: () => void;
};

/** The one pin on the picker, drawn without an index: this is a place, not a forecast. */
function pinAt(point: LatLng) {
  return [{ ...customSpot({ ...point, label: '' }), distanceKm: undefined, value: undefined }];
}

function PickerHeader({ onClose }: { onClose: () => void }): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.xl,
        minHeight: MIN_TOUCH_SIZE + space.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="h4" accessibilityRole="header">
          {t('diary.placeMapTitle')}
        </Text>
        <Text variant="metaSm" color={colors.textAlpha[55]}>
          {t('diary.placeMapHint')}
        </Text>
      </View>
      <IconButton icon="x" label={t('common.close')} onPress={onClose} size={MIN_TOUCH_SIZE} />
    </View>
  );
}

/**
 * The map, full screen, for one question: where was it caught? A tap moves the
 * pin; "Done" keeps it. The same map as the Map tab, so it looks familiar.
 */
export function PlaceMapModal({
  visible,
  initial,
  userLocation,
  onDone,
  onClose,
}: PlaceMapModalProps): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [point, setPoint] = useState(initial);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <PickerHeader onClose={onClose} />
        <View style={{ flex: 1 }}>
          {visible ? (
            <SpotMap
              spots={pinAt(point)}
              selectedId={CUSTOM_SPOT_ID}
              onSelect={() => undefined}
              onPickPoint={setPoint}
              userLocation={userLocation}
            />
          ) : null}
        </View>
        <View style={{ padding: space.xl, paddingBottom: insets.bottom + space.xl }}>
          <Button label={t('diary.placeDone')} onPress={() => onDone(point)} />
        </View>
      </View>
    </Modal>
  );
}
