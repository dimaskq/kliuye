import { View } from 'react-native';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

import { colors, radius, shadows } from '../tokens';

type CardTone = 'surface' | 'dark' | 'accent' | 'blaze';

export type CardProps = ViewProps & {
  tone?: CardTone;
  elevated?: boolean;
  radiusToken?: keyof typeof radius;
  style?: StyleProp<ViewStyle>;
};

const TONE_BACKGROUND: Record<CardTone, string> = {
  surface: colors.surface,
  dark: colors.accent2800,
  accent: colors.accent100,
  blaze: colors.accent,
};

/** A rounded panel — the recurring container of every screen. */
export function Card({
  tone = 'surface',
  elevated = false,
  radiusToken = 'lg',
  style,
  ...rest
}: CardProps): React.JSX.Element {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: TONE_BACKGROUND[tone],
          borderRadius: radius[radiusToken],
          overflow: 'hidden',
        },
        elevated ? shadows.sm : null,
        style,
      ]}
    />
  );
}
