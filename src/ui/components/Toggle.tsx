import { Pressable, View } from 'react-native';

import { colors, radius, shadows, sizes, space, MIN_TOUCH_SIZE } from '../tokens';

import { Text } from './Text';

export type ToggleProps = {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
};

/** Settings row with a switch; the whole row is the target, not just the track. */
export function Toggle({ label, hint, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
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
      <View
        style={{
          width: sizes.switchTrack.width,
          height: sizes.switchTrack.height,
          borderRadius: radius.pill,
          padding: 3,
          backgroundColor: value ? colors.accent : colors.textAlpha[20],
          alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View
          style={[
            {
              width: sizes.switchThumb,
              height: sizes.switchThumb,
              borderRadius: radius.pill,
              backgroundColor: colors.bg,
            },
            shadows.sm,
          ]}
        />
      </View>
    </Pressable>
  );
}
