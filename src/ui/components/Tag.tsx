import { View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { colors, radius, space } from '../tokens';

import { Text } from './Text';

export type TagTone = 'accent' | 'accent2' | 'neutral' | 'outline';

const TONE_STYLE: Record<TagTone, { container: ViewStyle; color: string }> = {
  accent: { container: { backgroundColor: colors.accent100 }, color: colors.accent800 },
  accent2: { container: { backgroundColor: colors.accent2100 }, color: colors.accent2800 },
  neutral: { container: { backgroundColor: colors.neutral[100] }, color: colors.neutral[800] },
  outline: { container: { borderWidth: 1, borderColor: colors.accent }, color: colors.accent700 },
};

/** Small labelled chip used in week details and tips. */
export function Tag({
  tone = 'neutral',
  label,
}: {
  tone?: TagTone;
  label: string;
}): React.JSX.Element {
  const { container, color } = TONE_STYLE[tone];
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
