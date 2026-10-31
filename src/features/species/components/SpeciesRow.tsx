import { Pressable, View } from 'react-native';

import type { SpeciesId } from '@/domain/bite-index';
import { Icon, ScoreBadge, Text, iconSize, radius, space, MIN_TOUCH_SIZE, useColors } from '@/ui';

import { SPECIES_ART } from '../speciesArt';

import { SpeciesArt } from './SpeciesArt';

/** Wide enough that the fish, not the frame, is what the eye lands on. */
const ROW_ART = 72;

export type SpeciesRowProps = {
  species: SpeciesId;
  name: string;
  meta: string;
  value: number;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

/** The engraving, or a plain fish where there is none. */
function RowArt({ species }: { species: SpeciesId }): React.JSX.Element {
  const colors = useColors();
  return (
    <View style={{ width: ROW_ART, alignItems: 'center' }}>
      {SPECIES_ART[species] === undefined ? (
        <Icon name="fish" size={iconSize.action * 1.3} color={colors.textAlpha[45]} />
      ) : (
        <SpeciesArt species={species} width={ROW_ART} />
      )}
    </View>
  );
}

/** One species: what it looks like, its index for the water in view, and when it is worth going. */
export function SpeciesRow({
  species,
  name,
  meta,
  value,
  selected,
  accessibilityLabel,
  onPress,
}: SpeciesRowProps): React.JSX.Element {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        minHeight: MIN_TOUCH_SIZE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        borderRadius: radius.row,
        borderWidth: 1,
        borderColor: selected ? 'transparent' : colors.textAlpha[12],
        backgroundColor: selected ? colors.surface : 'transparent',
        paddingVertical: 13,
        paddingHorizontal: 15,
      }}
    >
      <RowArt species={species} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="rowTitle">{name}</Text>
        <Text
          variant="metaSm"
          color={colors.textAlpha[55]}
          numberOfLines={1}
          style={{ marginTop: space.xxs }}
        >
          {meta}
        </Text>
      </View>
      <ScoreBadge value={value} selected={selected} />
    </Pressable>
  );
}
