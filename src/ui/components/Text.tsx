/* eslint-disable no-restricted-imports -- this component is the one wrapper around RN's Text. */
import { Text as RNText } from 'react-native';
import type { StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';

import { colors, textVariants } from '../tokens';
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
  color = colors.text,
  align,
  style,
  ...rest
}: TextProps): React.JSX.Element {
  return (
    <RNText
      {...rest}
      style={[textVariants[variant], { color }, align ? { textAlign: align } : null, style]}
    />
  );
}
