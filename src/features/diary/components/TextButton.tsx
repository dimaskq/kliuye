import { Pressable } from 'react-native';

import { Text, colors, space, MIN_TOUCH_SIZE } from '@/ui';

/** A quiet action next to a filled button: deleting should not shout. */
export function TextButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={space.md}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH_SIZE,
        justifyContent: 'center',
        paddingHorizontal: space.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text variant="button" color={colors.textAlpha[55]}>
        {label}
      </Text>
    </Pressable>
  );
}
