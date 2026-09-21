import { Pressable, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import type { Attachment } from '@/domain/diary';
import { Text, colors, radius, space, MIN_TOUCH_SIZE } from '@/ui';

import { MediaPreview } from './MediaPreview';

const shell: ViewStyle = {
  minHeight: MIN_TOUCH_SIZE,
  gap: space.xxs,
  borderRadius: radius.row,
  borderWidth: 1,
  borderColor: colors.textAlpha[12],
  paddingVertical: 13,
  paddingHorizontal: 15,
};

export type CatchRowProps = {
  species: string;
  /** "2.4 кг" or an em dash when the fish was never weighed. */
  weight: string;
  /** False when the fish was not weighed, so the dash stays quiet. */
  weighed: boolean;
  date: string;
  place: string;
  note: string;
  media: readonly Attachment[];
  accessibilityLabel: string;
  onPress: () => void;
};

/** One entry in the journal: what, how heavy, when and where. */
export function CatchRow({
  species,
  weight,
  weighed,
  date,
  place,
  note,
  media,
  accessibilityLabel,
  onPress,
}: CatchRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        shell,
        { backgroundColor: pressed ? colors.surface : 'transparent' },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.md }}>
        <Text variant="rowTitle" style={{ flex: 1 }} numberOfLines={1}>
          {species}
        </Text>
        <Text variant="numericSm" {...(weighed ? {} : { color: colors.textAlpha[45] })}>
          {weight}
        </Text>
      </View>
      <Text variant="metaSm" color={colors.textAlpha[55]} numberOfLines={1}>
        {date} · {place}
      </Text>
      <MediaPreview media={media} />
      {note === '' ? null : (
        <Text
          variant="metaSm"
          color={colors.textAlpha[68]}
          numberOfLines={2}
          style={{ marginTop: space.xxs }}
        >
          {note}
        </Text>
      )}
    </Pressable>
  );
}
