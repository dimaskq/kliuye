import { Pressable, View } from 'react-native';

import type { CustomPoint } from '@/domain/spots';
import { IconButton, Text, colors, radius, space, MIN_TOUCH_SIZE } from '@/ui';

export type PointRowProps = {
  point: CustomPoint;
  /** Name to show when the point was never named. */
  fallbackName: string;
  selected: boolean;
  favourite: boolean;
  favouriteLabel: string;
  onPress: () => void;
  onToggleFavourite: () => void;
};

/** A remembered place: its name, and whether it is kept. */
export function PointRow({
  point,
  fallbackName,
  selected,
  favourite,
  favouriteLabel,
  onPress,
  onToggleFavourite,
}: PointRowProps): React.JSX.Element {
  const name = point.label === '' ? fallbackName : point.label;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.row,
        borderWidth: 1,
        borderColor: selected ? 'transparent' : colors.textAlpha[12],
        backgroundColor: selected ? colors.surface : 'transparent',
        paddingRight: space.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={name}
        onPress={onPress}
        style={{
          flex: 1,
          minHeight: MIN_TOUCH_SIZE,
          justifyContent: 'center',
          paddingVertical: space.xl,
          paddingHorizontal: 15,
        }}
      >
        <Text variant="rowTitle">{name}</Text>
      </Pressable>
      <IconButton
        icon="star"
        label={favouriteLabel}
        selected={favourite}
        size={MIN_TOUCH_SIZE}
        color={favourite ? colors.accent : colors.textAlpha[35]}
        onPress={onToggleFavourite}
      />
    </View>
  );
}
