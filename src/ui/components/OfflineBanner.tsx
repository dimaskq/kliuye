import { View } from 'react-native';

import { colors, iconSize, radius, space } from '../tokens';

import { Icon } from './Icon';
import { Text } from './Text';

/**
 * States the one fact the angler needs when nothing refreshes: there is no
 * signal, and what is on screen came from the cache. It never covers a control
 * and never asks for anything — the app keeps working without a connection.
 */
export function OfflineBanner({ label }: { label: string }): React.JSX.Element {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: space.sm,
        backgroundColor: colors.neutral[800],
        borderRadius: radius.pill,
        paddingVertical: space.sm,
        paddingHorizontal: space.xl,
      }}
    >
      <Icon name="wifi-off" size={iconSize.inline} color={colors.neutral[100]} />
      <Text variant="emphasisSm" color={colors.neutral[100]}>
        {label}
      </Text>
    </View>
  );
}
