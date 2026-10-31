import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton, Text, iconSize, space, MIN_TOUCH_SIZE, useColors } from '@/ui';

const HEADER_BUTTON = {
  size: MIN_TOUCH_SIZE,
  glyphSize: iconSize.tab,
} as const;

export type MapHeaderProps = {
  onFocusPin: () => void;
  onOpenPlaces: () => void;
};

/** The question the screen answers, and the two ways back to a place. */
export function MapHeader({ onFocusPin, onOpenPlaces }: MapHeaderProps): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Text variant="h4" numberOfLines={2} accessibilityRole="header" style={{ flex: 1 }}>
        {t('map.headerTitle')}
      </Text>
      <IconButton
        {...HEADER_BUTTON}
        background={colors.surface}
        icon="map-pin"
        label={t('map.focusPin')}
        onPress={onFocusPin}
      />
      <IconButton
        {...HEADER_BUTTON}
        background={colors.surface}
        icon="list"
        label={t('map.placesTitle')}
        onPress={onOpenPlaces}
      />
    </View>
  );
}
