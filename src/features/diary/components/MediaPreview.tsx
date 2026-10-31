import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';

import type { Attachment } from '@/domain/diary';
import { Icon, Text, iconSize, radius, space, sizes, useColors } from '@/ui';

import { MediaViewer } from './MediaViewer';
import { Thumb } from './Thumb';

/** Tall enough to see the fish, short enough that the list still reads as a list. */
const HERO_HEIGHT = 190;
/** Small tiles under the big one; the rest is a "+N". */
const SHOWN_BELOW = 4;

type OpenProps = { label: string; onOpen: () => void; children: React.ReactNode };

function Opens({ label, onOpen, children }: OpenProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={label}
      onPress={onOpen}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      {children}
    </Pressable>
  );
}

/** The first photo, wide: the catch should be seen, not guessed at from a stamp. */
function Hero({ item }: { item: Attachment }): React.JSX.Element {
  const colors = useColors();
  return (
    <View
      style={{
        height: HERO_HEIGHT,
        borderRadius: radius.thumb,
        overflow: 'hidden',
        backgroundColor: colors.accent300,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {item.posterUri === '' ? null : (
        <Image
          source={{ uri: item.posterUri }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}
      {item.kind === 'video' ? (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.textAlpha[68],
          }}
        >
          <Icon name="play" size={iconSize.action} color={colors.onDeep} />
        </View>
      ) : null}
    </View>
  );
}

function More({ count }: { count: number }): React.JSX.Element {
  const colors = useColors();
  return (
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
        +{count}
      </Text>
    </View>
  );
}

/**
 * An entry's photos in the journal: the first one large, the next few small.
 * Any of them opens full screen.
 */
export function MediaPreview({
  media,
}: {
  media: readonly Attachment[];
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number>();
  const [first, ...rest] = media;
  if (first === undefined) return null;

  const below = rest.slice(0, SHOWN_BELOW);
  const hidden = rest.length - below.length;
  const labelOf = (index: number): string =>
    t('diary.mediaOpen', { current: index + 1, total: media.length });

  return (
    <View style={{ gap: space.xs, marginTop: space.md }}>
      <Opens label={labelOf(0)} onOpen={() => setOpen(0)}>
        <Hero item={first} />
      </Opens>
      {below.length === 0 ? null : (
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          {below.map((item, at) => (
            <Opens key={item.id} label={labelOf(at + 1)} onOpen={() => setOpen(at + 1)}>
              <Thumb item={item} size={sizes.thumbSm} />
            </Opens>
          ))}
          {hidden === 0 ? null : (
            <Opens label={labelOf(SHOWN_BELOW + 1)} onOpen={() => setOpen(SHOWN_BELOW + 1)}>
              <More count={hidden} />
            </Opens>
          )}
        </View>
      )}
      <MediaViewer media={media} index={open} onClose={() => setOpen(undefined)} />
    </View>
  );
}
