import { Pressable, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useColors } from '../theme';
import { iconSize, radius, space, MIN_TOUCH_SIZE } from '../tokens';
import type { Colors } from '../tokens';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

type ButtonTone = 'onDark' | 'primary' | 'ink';

function toneOf(colors: Colors, tone: ButtonTone): { background: string; label: string } {
  return {
    onDark: { background: colors.bg, label: colors.accent800 },
    primary: { background: colors.accent, label: colors.onAccent },
    /** For the blaze card: a solid ink button, like the float's dark stem. */
    ink: { background: colors.ink, label: colors.lure },
  }[tone];
}

export type ButtonProps = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  /** Leading glyph, drawn in the label colour. */
  icon?: IconName;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/** Pill-shaped call to action; the pressed state dims rather than recolours. */
export function Button({
  label,
  onPress,
  tone = 'primary',
  icon,
  accessibilityHint,
  style,
}: ButtonProps): React.JSX.Element {
  const colors = useColors();
  const { background, label: labelColor } = toneOf(colors, tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignSelf: 'flex-start',
          minHeight: MIN_TOUCH_SIZE,
          justifyContent: 'center',
          backgroundColor: background,
          borderRadius: radius.pill,
          paddingVertical: 10,
          paddingHorizontal: 18,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.md,
        }}
      >
        {icon === undefined ? null : <Icon name={icon} size={iconSize.action} color={labelColor} />}
        <Text variant="button" color={labelColor}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
