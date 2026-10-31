import { View } from 'react-native';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

import { useColors } from '../theme';
import { radius, shadows } from '../tokens';
import type { Colors } from '../tokens';

type CardTone = 'surface' | 'dark' | 'accent' | 'blaze';

export type CardProps = ViewProps & {
  tone?: CardTone;
  elevated?: boolean;
  radiusToken?: keyof typeof radius;
  style?: StyleProp<ViewStyle>;
};

function backgroundOf(colors: Colors, tone: CardTone): string {
  return {
    surface: colors.surface,
    dark: colors.deep,
    accent: colors.accent100,
    blaze: colors.accent,
  }[tone];
}

/** A rounded panel — the recurring container of every screen. */
export function Card({
  tone = 'surface',
  elevated = false,
  radiusToken = 'lg',
  style,
  ...rest
}: CardProps): React.JSX.Element {
  const colors = useColors();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: backgroundOf(colors, tone),
          borderRadius: radius[radiusToken],
          overflow: 'hidden',
        },
        elevated ? shadows.sm : null,
        style,
      ]}
    />
  );
}
