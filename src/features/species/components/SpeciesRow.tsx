import { Pressable, View } from 'react-native';

import { Icon, ScoreBadge, Text, colors, iconSize, radius, space, MIN_TOUCH_SIZE } from '@/ui';

export type SpeciesRowProps = {
  name: string;
  meta: string;
  value: number;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

/** One species: its index for the water in view, and when it is worth going. */
export function SpeciesRow({
  name,
  meta,
  value,
  selected,
  accessibilityLabel,
  onPress,
}: SpeciesRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        minHeight: MIN_TOUCH_SIZE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        borderRadius: radius.row,
        borderWidth: 1,
        borderColor: selected ? 'transparent' : colors.textAlpha[12],
        backgroundColor: selected ? colors.surface : 'transparent',
        paddingVertical: 13,
        paddingHorizontal: 15,
      }}
    >
      <ScoreBadge value={value} selected={selected} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="rowTitle">{name}</Text>
        <Text
          variant="metaSm"
          color={colors.textAlpha[55]}
          numberOfLines={1}
          style={{ marginTop: space.xxs }}
        >
          {meta}
        </Text>
      </View>
      {selected ? <Icon name="chevron-right" size={iconSize.action} color={colors.accent} /> : null}
    </Pressable>
  );
}
