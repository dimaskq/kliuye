import { View } from 'react-native';

import { colors, radius, space } from '../tokens';

import { Icon } from './Icon';
import { Text } from './Text';

/** Offline marker: cached content stays visible, its age stated openly. */
export function StaleBadge({ label }: { label: string }): React.JSX.Element {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: space.sm,
        backgroundColor: colors.neutral[200],
        borderRadius: radius.pill,
        paddingVertical: space.sm,
        paddingHorizontal: space.xl,
      }}
    >
      <Icon name="clock" color={colors.neutral[700]} />
      <Text variant="emphasisSm" color={colors.neutral[800]}>
        {label}
      </Text>
    </View>
  );
}
