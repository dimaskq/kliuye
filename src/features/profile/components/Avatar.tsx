import { Image, View } from 'react-native';

import { Icon, Text, colors, radius, space } from '@/ui';

export type AvatarProps = {
  uri: string;
  initials: string;
  size: number;
  /** A small pencil on the rim, saying the picture can be changed. */
  editable?: boolean;
};

const BADGE = 24;

/** The angler's photo, or their initials on the accent when there is none. */
export function Avatar({ uri, initials, size, editable = false }: AvatarProps): React.JSX.Element {
  return (
    <View style={{ width: size, height: size }}>
      {uri === '' ? (
        <View
          style={{
            flex: 1,
            borderRadius: radius.pill,
            backgroundColor: colors.accent300,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant={size > 80 ? 'h2' : 'numericSm'} color={colors.accent900}>
            {initials}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          accessibilityIgnoresInvertColors
          style={{ width: size, height: size, borderRadius: radius.pill }}
        />
      )}
      {editable ? (
        <View
          style={{
            position: 'absolute',
            right: -space.xxs,
            bottom: -space.xxs,
            width: BADGE,
            height: BADGE,
            borderRadius: radius.pill,
            backgroundColor: colors.text,
            borderWidth: 2,
            borderColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="pencil" size={12} color={colors.lure} />
        </View>
      ) : null}
    </View>
  );
}
