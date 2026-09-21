import { Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, iconSize, radius, sizes, MIN_TOUCH_SIZE } from '../tokens';

import { Icon } from './Icon';
import type { IconName } from './Icon';

export type IconButtonProps = {
  icon: IconName;
  /** Spoken name; an icon alone says nothing to a screen reader. */
  label: string;
  onPress: () => void;
  /** Diameter of the visible circle; the touch target never drops below the minimum. */
  size?: number;
  glyphSize?: number;
  color?: string;
  background?: string;
  strokeWidth?: number;
  disabled?: boolean;
  /** For toggles such as a star: announced as selected. */
  selected?: boolean;
  /** Work in progress: announced, and the button stops taking taps. */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Replaces the glyph, e.g. with one that animates. */
  children?: React.ReactNode;
};

const PRESSED_OPACITY = 0.6;
const DISABLED_OPACITY = 0.3;

function circle(size: number, background: string, disabled: boolean, pressed: boolean): ViewStyle {
  return {
    width: size,
    height: size,
    borderRadius: radius.pill,
    backgroundColor: background,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? DISABLED_OPACITY : pressed ? PRESSED_OPACITY : 1,
  };
}

/** A round, icon-only button — the one used everywhere a word would not fit. */
export function IconButton({
  icon,
  label,
  onPress,
  size = sizes.iconButton,
  glyphSize = iconSize.action,
  color = colors.text,
  background = 'transparent',
  strokeWidth,
  disabled = false,
  selected,
  busy = false,
  style,
  children,
}: IconButtonProps): React.JSX.Element {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: inactive,
        busy,
        ...(selected === undefined ? {} : { selected }),
      }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={Math.max(0, (MIN_TOUCH_SIZE - size) / 2)}
      style={({ pressed }) => [circle(size, background, disabled, pressed), style]}
    >
      {children ?? (
        <Icon
          name={icon}
          size={glyphSize}
          color={color}
          {...(strokeWidth === undefined ? {} : { strokeWidth })}
        />
      )}
    </Pressable>
  );
}
