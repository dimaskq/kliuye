import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Modal, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Attachment } from '@/domain/diary';
import { Icon, IconButton, Text, iconSize, radius, space, MIN_TOUCH_SIZE, useColors } from '@/ui';

const PLAY_BADGE = 72;

export type MediaViewerProps = {
  media: readonly Attachment[];
  /** Which one is open; `undefined` keeps the viewer closed. */
  index: number | undefined;
  onClose: () => void;
};

type PageProps = { item: Attachment; width: number; height: number; label: string };

/**
 * One photo, the size of the screen. Sized in numbers, not with flex: inside a
 * horizontal list a flexed page has no height to fill, and the photo drew at
 * zero height — a black screen with only the cross on it.
 */
function Page({ item, width, height, label }: PageProps): React.JSX.Element {
  const colors = useColors();
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      {item.posterUri === '' ? null : (
        <Image
          source={{ uri: item.posterUri }}
          style={{ width, height }}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel={label}
          accessibilityIgnoresInvertColors
        />
      )}
      {item.kind === 'video' ? (
        <View
          style={{
            position: 'absolute',
            width: PLAY_BADGE,
            height: PLAY_BADGE,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.textAlpha[68],
          }}
        >
          <Icon name="play" size={iconSize.action * 1.6} color={colors.onDeep} />
        </View>
      ) : null}
    </View>
  );
}

type PagesProps = {
  media: readonly Attachment[];
  start: number;
  onPage: (index: number) => void;
};

/** The photos side by side, one screen each, swiped like a gallery. */
function Pages({ media, start, onPage }: PagesProps): React.JSX.Element {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  /* Plain scroll events: the momentum one never arrives in a browser. */
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    onPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };
  return (
    <FlatList
      style={{ flex: 1 }}
      data={media}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={start}
      getItemLayout={(_, at) => ({ length: width, offset: width * at, index: at })}
      onScroll={onScroll}
      scrollEventThrottle={100}
      renderItem={({ item, index: at }) => (
        <Page
          item={item}
          width={width}
          height={height}
          label={t('diary.mediaPhoto', { current: at + 1, total: media.length })}
        />
      )}
    />
  );
}

type TopBarProps = { position: string; closeLabel: string; top: number; onClose: () => void };

function TopBar({ position, closeLabel, top, onClose }: TopBarProps): React.JSX.Element {
  const colors = useColors();
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left: space.xl,
        right: space.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text variant="emphasisSm" color={colors.white}>
        {position}
      </Text>
      <IconButton
        icon="x"
        label={closeLabel}
        onPress={onClose}
        size={MIN_TOUCH_SIZE}
        color={colors.white}
        background={colors.textAlpha[68]}
      />
    </View>
  );
}

/**
 * A photo from the journal, full screen on black, swiped through like a phone
 * gallery. The system back gesture and the cross both close it.
 */
export function MediaViewer({ media, index, onClose }: MediaViewerProps): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index ?? 0);
  const [opened, setOpened] = useState(index);

  /* A new tap opens on the photo that was tapped, not where the last swipe ended. */
  if (index !== opened) {
    setOpened(index);
    if (index !== undefined) setCurrent(index);
  }

  return (
    <Modal
      visible={index !== undefined}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: colors.media }}>
        {index === undefined ? null : <Pages media={media} start={index} onPage={setCurrent} />}
        <TopBar
          position={
            media.length > 1
              ? t('diary.mediaPosition', { current: current + 1, total: media.length })
              : ''
          }
          closeLabel={t('diary.mediaClose')}
          top={insets.top + space.sm}
          onClose={onClose}
        />
      </View>
    </Modal>
  );
}
