import { View } from 'react-native';

import { colors, radius, sizes } from '../tokens';

import { Text } from './Text';

export type ScoreBadgeProps = {
  value: number;
  selected: boolean;
  size?: number;
};

/** The circular index chip shared by map pins and the nearby-spot rows. */
export function ScoreBadge({
  value,
  selected,
  size = sizes.spotBadge,
}: ScoreBadgeProps): React.JSX.Element {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.accent : colors.bg,
      }}
    >
      <Text variant="numericXs" color={selected ? colors.onAccent : colors.text}>
        {value}
      </Text>
    </View>
  );
}
