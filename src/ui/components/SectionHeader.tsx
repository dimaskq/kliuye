import { View } from 'react-native';

import { colors, space } from '../tokens';

import { Text } from './Text';

/** "ВИД РИБИ / SPECIES" — the two-voice label above each block. */
export function SectionHeader({
  title,
  aside,
}: {
  title: string;
  aside?: string;
}): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: space.lg,
      }}
    >
      <Text variant="kicker" accessibilityRole="header">
        {title}
      </Text>
      {aside === undefined ? null : (
        <Text variant="kickerMuted" color={colors.textAlpha[45]}>
          {aside}
        </Text>
      )}
    </View>
  );
}
