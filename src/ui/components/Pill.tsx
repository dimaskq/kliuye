import { Pressable, View } from 'react-native';

import { colors, iconSize, radius, space, MIN_TOUCH_SIZE } from '../tokens';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

export type PillProps = {
  label: string;
  /** Secondary value shown after the label, e.g. the species index. */
  detail?: string | undefined;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Trailing glyph; a chevron marks a pill that opens something. */
  trailingIcon?: IconName | undefined;
  /** A pill that navigates is a button, not one of a set of choices. */
  role?: 'radio' | 'button';
};

function PillContent({
  label,
  detail,
  selected,
  trailingIcon,
}: Pick<PillProps, 'label' | 'detail' | 'selected' | 'trailingIcon'>): React.JSX.Element {
  const tint = selected ? colors.onAccent : colors.text;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Text variant="pill" color={tint}>
        {label}
      </Text>
      {detail === undefined ? null : (
        <Text variant="caption" color={tint} style={{ opacity: 0.7 }}>
          {detail}
        </Text>
      )}
      {trailingIcon === undefined ? null : (
        <Icon
          name={trailingIcon}
          size={iconSize.inline}
          color={selected ? colors.onAccent : colors.textAlpha[45]}
        />
      )}
    </View>
  );
}

/** Horizontally scrolling selector chip (species picker, language picker). */
export function Pill({
  label,
  detail,
  selected,
  onPress,
  accessibilityLabel,
  trailingIcon,
  role = 'radio',
}: PillProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={space.md}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH_SIZE,
        justifyContent: 'center',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.accent : 'transparent',
        backgroundColor: selected ? colors.accent : colors.surface,
        paddingVertical: space.lg,
        paddingHorizontal: 15,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <PillContent label={label} detail={detail} selected={selected} trailingIcon={trailingIcon} />
    </Pressable>
  );
}
