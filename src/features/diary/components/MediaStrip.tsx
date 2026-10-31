import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import type { Attachment } from '@/domain/diary';
import { Icon, IconButton, Text, iconSize, radius, sizes, space, useColors } from '@/ui';

import { MediaViewer } from './MediaViewer';
import { Thumb } from './Thumb';

const REMOVE_SIZE = 22;

type MediaTileProps = {
  item: Attachment;
  openLabel: string;
  removeLabel: string;
  onOpen: () => void;
  onRemove: () => void;
};

/** One attached photo or clip: a tap opens it, the cross in the corner removes it. */
function MediaTile({
  item,
  openLabel,
  removeLabel,
  onOpen,
  onRemove,
}: MediaTileProps): React.JSX.Element {
  const colors = useColors();
  return (
    <View>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={openLabel} onPress={onOpen}>
        <Thumb item={item} size={sizes.thumbLg} />
      </Pressable>
      <IconButton
        icon="x"
        label={removeLabel}
        onPress={onRemove}
        size={REMOVE_SIZE}
        glyphSize={iconSize.inline}
        color={colors.bg}
        background={colors.textAlpha[68]}
        style={{ position: 'absolute', top: space.xs, right: space.xs }}
      />
    </View>
  );
}

export type MediaStripProps = {
  media: readonly Attachment[];
  /** What the add tile says right now: add, working, or full. */
  label: string;
  disabled: boolean;
  removeLabel: (index: number) => string;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

type AddTileProps = Pick<MediaStripProps, 'label' | 'disabled' | 'onAdd'>;

/** The dashed tile that adds another photo or clip. */
function AddTile({ label, disabled, onAdd }: AddTileProps): React.JSX.Element {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onAdd}
      style={({ pressed }) => ({
        width: sizes.thumbLg,
        height: sizes.thumbLg,
        borderRadius: radius.thumb,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.textAlpha[45],
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xxs,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Icon name="image-plus" size={iconSize.action} color={colors.textAlpha[68]} />
      <Text variant="tab" color={colors.textAlpha[55]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Photos and clips attached to the entry, with a tile that adds more. */
export function MediaStrip({
  media,
  label,
  disabled,
  removeLabel,
  onAdd,
  onRemove,
}: MediaStripProps): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number>();
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.md, paddingRight: space.xxl }}
      >
        {media.map((item, index) => (
          <MediaTile
            key={item.id}
            item={item}
            openLabel={t('diary.mediaOpen', { current: index + 1, total: media.length })}
            removeLabel={removeLabel(index + 1)}
            onOpen={() => setOpen(index)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
        <AddTile label={label} disabled={disabled} onAdd={onAdd} />
      </ScrollView>
      <MediaViewer media={media} index={open} onClose={() => setOpen(undefined)} />
    </>
  );
}
