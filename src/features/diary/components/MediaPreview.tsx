import { View } from 'react-native';

import type { Attachment } from '@/domain/diary';
import { Text, colors, radius, space, sizes } from '@/ui';

import { Thumb } from './Thumb';

const SHOWN = 3;

/** The first few photos of an entry, with a count when there are more. */
export function MediaPreview({
  media,
}: {
  media: readonly Attachment[];
}): React.JSX.Element | null {
  if (media.length === 0) return null;
  const shown = media.slice(0, SHOWN);
  const hidden = media.length - shown.length;

  return (
    <View style={{ flexDirection: 'row', gap: space.xs, marginTop: space.md }}>
      {shown.map((item) => (
        <Thumb key={item.id} item={item} size={sizes.thumbSm} />
      ))}
      {hidden === 0 ? null : (
        <View
          style={{
            width: sizes.thumbSm,
            height: sizes.thumbSm,
            borderRadius: radius.thumb,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent300,
          }}
        >
          <Text variant="numericSm" color={colors.accent900}>
            +{hidden}
          </Text>
        </View>
      )}
    </View>
  );
}
