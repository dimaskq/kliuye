import { View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { useColors } from '../theme';
import { radius, space } from '../tokens';
import type { Colors } from '../tokens';

import { Text } from './Text';

export type TagTone = 'accent' | 'accent2' | 'neutral' | 'outline';

function toneOf(colors: Colors, tone: TagTone): { container: ViewStyle; color: string } {
  return {
    accent: { container: { backgroundColor: colors.accent100 }, color: colors.accent800 },
    accent2: { container: { backgroundColor: colors.accent2100 }, color: colors.accent2800 },
    neutral: { container: { backgroundColor: colors.neutral[100] }, color: colors.neutral[800] },
    outline: { container: { borderWidth: 1, borderColor: colors.accent }, color: colors.accent700 },
  }[tone];
}

/** Small labelled chip used in week details and tips. */
export function Tag({
  tone = 'neutral',
  label,
}: {
  tone?: TagTone;
  label: string;
}): React.JSX.Element {
  const colors = useColors();
  const { container, color } = toneOf(colors, tone);
  return (
    <View
      style={[
        {
          borderRadius: radius.tag,
          paddingVertical: 3,
          paddingHorizontal: space.md + 2,
          alignSelf: 'flex-start',
        },
        container,
      ]}
    >
      <Text variant="tag" color={color}>
        {label}
      </Text>
    </View>
  );
}
