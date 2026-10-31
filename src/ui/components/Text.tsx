/* eslint-disable no-restricted-imports -- this component is the one wrapper around RN's Text. */
import { Text as RNText } from 'react-native';
import type { StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';

import { useColors } from '../theme';
import { textVariants } from '../tokens';
import type { TextVariant } from '../tokens';

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
};

/**
 * The only text primitive in the app: every size, weight and letter-spacing
 * comes from the token scale, so the type ramp cannot drift per screen.
 */
export function Text({
  variant = 'body',
  color: colorProp,
  align,
  style,
  ...rest
}: TextProps): React.JSX.Element {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  return (
    <RNText
      {...rest}
      style={[textVariants[variant], { color }, align ? { textAlign: align } : null, style]}
    />
  );
}
