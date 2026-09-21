import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import Animated, { LinearTransition, ReduceMotion } from 'react-native-reanimated';

import type { SpeciesId } from '@/domain/bite-index';
import { Pill, motion, space } from '@/ui';

import { ALL_SPECIES, speciesPillOrder } from '../speciesOrder';

const pillLayout = LinearTransition.duration(motion.expand).reduceMotion(ReduceMotion.System);

export type SpeciesPickerProps = {
  selected: SpeciesId;
  /** Index per species, so the chip can show what switching would give. */
  scores: Readonly<Record<SpeciesId, number>>;
  onSelect: (species: SpeciesId) => void;
  /** The "all species" chip opens the full catalogue instead of choosing. */
  onOpenAll: () => void;
};

/** Horizontal chip row; the chosen fish sits first so it is always in sight. */
export function SpeciesPicker({
  selected,
  scores,
  onSelect,
  onOpenAll,
}: SpeciesPickerProps): React.JSX.Element {
  const { t } = useTranslation();
  const row = useRef<ScrollView>(null);

  /* A new choice moves to the front, so the row goes back to the front with it. */
  useEffect(() => {
    row.current?.scrollTo({ x: 0, animated: true });
  }, [selected]);

  return (
    <ScrollView
      ref={row}
      horizontal
      accessibilityRole="radiogroup"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.md, paddingBottom: space.xxs }}
    >
      <Pill
        label={t(`species.${ALL_SPECIES}`)}
        detail={String(scores[ALL_SPECIES])}
        selected={selected === ALL_SPECIES}
        onPress={onOpenAll}
        role="button"
        trailingIcon="chevron-right"
        accessibilityLabel={t('speciesPicker.open')}
      />
      {speciesPillOrder(selected).map((id) => {
        const name = t(`species.${id}`);
        const value = scores[id];
        return (
          <Animated.View key={id} layout={pillLayout}>
            <Pill
              label={name}
              detail={String(value)}
              selected={id === selected}
              onPress={() => onSelect(id)}
              accessibilityLabel={t('today.speciesAccessible', { name, value })}
            />
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}
