import { ScrollView, View } from 'react-native';

import type { SpeciesId } from '@/domain/bite-index';
import { Pill, SectionHeader, space } from '@/ui';

export type SpeciesChoiceGroup = {
  habitat: string;
  title: string;
  ids: readonly SpeciesId[];
};

export type SpeciesChoiceProps = {
  groups: readonly SpeciesChoiceGroup[];
  selected: SpeciesId;
  nameOf: (id: SpeciesId) => string;
  onSelect: (id: SpeciesId) => void;
};

/** Which fish it was: one row of chips per habitat, so the list stays short. */
export function SpeciesChoice({
  groups,
  selected,
  nameOf,
  onSelect,
}: SpeciesChoiceProps): React.JSX.Element {
  return (
    <View style={{ gap: space.lg }}>
      {groups.map((group) => (
        <View key={group.habitat}>
          <SectionHeader title={group.title} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.md, paddingRight: space.xxl }}
          >
            {group.ids.map((id) => (
              <Pill
                key={id}
                label={nameOf(id)}
                selected={id === selected}
                accessibilityLabel={nameOf(id)}
                onPress={() => onSelect(id)}
              />
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}
