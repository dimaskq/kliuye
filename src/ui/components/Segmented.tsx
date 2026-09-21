import { Pressable, View } from 'react-native';

import { colors, radius, space, MIN_TOUCH_SIZE } from '../tokens';

import { Text } from './Text';

export type Segment = {
  id: string;
  label: string;
  /** Shown after the label, e.g. how many entries the section holds. */
  count?: number | undefined;
};

export type SegmentedProps = {
  segments: readonly Segment[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/** A row of equal tabs inside a screen; the active one is filled. */
export function Segmented({ segments, selectedId, onSelect }: SegmentedProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        gap: space.xs,
        backgroundColor: colors.textAlpha[8],
        borderRadius: radius.pill,
        padding: space.xs,
      }}
    >
      {segments.map((segment) => {
        const active = segment.id === selectedId;
        return (
          <Pressable
            key={segment.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={segment.label}
            onPress={() => onSelect(segment.id)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: MIN_TOUCH_SIZE - space.xl,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              backgroundColor: active ? colors.bg : 'transparent',
              paddingVertical: space.md,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text variant="pill" color={active ? colors.text : colors.textAlpha[55]}>
              {segment.count === undefined ? segment.label : `${segment.label} ${segment.count}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
