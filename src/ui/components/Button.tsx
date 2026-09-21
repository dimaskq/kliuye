import { Pressable, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, iconSize, radius, space, MIN_TOUCH_SIZE } from '../tokens';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

type ButtonTone = 'onDark' | 'primary' | 'ink';

const TONE: Record<ButtonTone, { background: string; label: string }> = {
  onDark: { background: colors.bg, label: colors.accent800 },
  primary: { background: colors.accent, label: colors.onAccent },
  /** For the blaze card: a solid ink button, like the float's dark stem. */
  ink: { background: colors.text, label: colors.lure },
};

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
  const { background, label: labelColor } = TONE[tone];
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
