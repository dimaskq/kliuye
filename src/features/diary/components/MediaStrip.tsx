import { Pressable, ScrollView, View } from 'react-native';

import type { Attachment } from '@/domain/diary';
import { Icon, IconButton, Text, colors, iconSize, radius, sizes, space } from '@/ui';

import { Thumb } from './Thumb';

const REMOVE_SIZE = 22;

type MediaTileProps = { item: Attachment; removeLabel: string; onRemove: () => void };

/** One attached photo or clip, with its remove cross in the corner. */
function MediaTile({ item, removeLabel, onRemove }: MediaTileProps): React.JSX.Element {
  return (
    <View>
      <Thumb item={item} size={sizes.thumbLg} />
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

/** Photos and clips attached to the entry, with a tile that adds more. */
export function MediaStrip({
  media,
  label,
  disabled,
  removeLabel,
  onAdd,
  onRemove,
}: MediaStripProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.md, paddingRight: space.xxl }}
    >
      {media.map((item, index) => (
        <MediaTile
          key={item.id}
          item={item}
          removeLabel={removeLabel(index + 1)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
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
    </ScrollView>
  );
}
