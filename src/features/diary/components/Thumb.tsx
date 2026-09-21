import { Image, View } from 'react-native';

import type { Attachment } from '@/domain/diary';
import { Icon, colors, iconSize, radius } from '@/ui';

/** A clip with no still frame still has to look like a clip, not like nothing. */
function VideoBadge({ size }: { size: number }): React.JSX.Element {
  const badge = Math.round(size / 3);
  return (
    <View
      style={{
        position: 'absolute',
        right: 4,
        bottom: 4,
        width: badge,
        height: badge,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.textAlpha[68],
      }}
    >
      <Icon name="play" size={iconSize.inline} color={colors.bg} />
    </View>
  );
}

export type ThumbProps = {
  item: Attachment;
  size: number;
};

/** One photo or clip, cropped square. */
export function Thumb({ item, size }: ThumbProps): React.JSX.Element {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.thumb,
        overflow: 'hidden',
        backgroundColor: colors.accent300,
      }}
    >
      {item.posterUri === '' ? null : (
        <Image
          source={{ uri: item.posterUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}
      {item.kind === 'video' ? <VideoBadge size={size} /> : null}
    </View>
  );
}
