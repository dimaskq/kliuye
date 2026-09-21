import { Pressable, View } from 'react-native';

import { colors, iconSize, space, MIN_TOUCH_SIZE } from '../tokens';

import { Icon } from './Icon';
import { Text } from './Text';

export type NavRowProps = {
  label: string;
  hint: string;
  onPress: () => void;
};

/** A settings row that navigates rather than toggles. */
export function NavRow({ label, hint, onPress }: NavRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={{
        minHeight: MIN_TOUCH_SIZE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xl,
        paddingVertical: 13,
        paddingHorizontal: space.xxl,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="label">{label}</Text>
        <Text variant="caption" color={colors.textAlpha[52]} style={{ marginTop: 1 }}>
          {hint}
        </Text>
      </View>
      <Icon name="chevron-right" size={iconSize.action} color={colors.textAlpha[35]} />
    </Pressable>
  );
}
