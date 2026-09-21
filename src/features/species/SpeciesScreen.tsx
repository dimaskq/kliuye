import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { SpeciesId } from '@/domain/bite-index';
import { useCurrentForecast } from '@/hooks';
import { useSelection } from '@/store';
import { Screen, SectionHeader, Text, colors, space } from '@/ui';

import { SpeciesRow } from './components';
import { speciesGroups } from './speciesRows';
import type { SpeciesGroup, SpeciesRow as Row } from './speciesRows';
import { useSpeciesScores } from './useSpeciesScores';

function useRowMeta(): (row: Row) => string {
  const { t } = useTranslation();
  return (row: Row) => {
    const [from, to] = row.optimum;
    const optimum = t('speciesPicker.optimum', { from, to });
    return row.inSeason ? optimum : `${optimum} · ${t('speciesPicker.outOfSeason')}`;
  };
}

type GroupProps = {
  group: SpeciesGroup;
  selected: SpeciesId;
  metaOf: (row: Row) => string;
  onChoose: (id: SpeciesId) => void;
};

function Group({ group, selected, metaOf, onChoose }: GroupProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View>
      <SectionHeader title={t(`speciesPicker.group.${group.habitat}`)} />
      <View style={{ gap: space.lg }}>
        {group.rows.map((row) => {
          const name = t(`species.${row.id}`);
          const meta = metaOf(row);
          return (
            <SpeciesRow
              key={row.id}
              name={name}
              meta={meta}
              value={row.value}
              selected={row.id === selected}
              accessibilityLabel={t('speciesPicker.accessible', { name, value: row.value, meta })}
              onPress={() => onChoose(row.id)}
            />
          );
        })}
      </View>
    </View>
  );
}

/** Every species the app knows, grouped by where it is fished. */
export function SpeciesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const metaOf = useRowMeta();
  const speciesId = useSelection((state) => state.speciesId);
  const setSpecies = useSelection((state) => state.setSpecies);
  const { model } = useCurrentForecast();
  const scores = useSpeciesScores();

  /* The catalogue is opened over Today, so a choice dismisses back down to it.
     `dismissTo` also lands correctly when this page was opened by a deep link. */
  const choose = (id: SpeciesId): void => {
    setSpecies(id);
    router.dismissTo('/');
  };

  return (
    <Screen>
      <View>
        <Text variant="h2" accessibilityRole="header">
          {t('speciesPicker.title')}
        </Text>
        <Text variant="emphasis" color={colors.textAlpha[55]}>
          {t('speciesPicker.subtitle')}
        </Text>
      </View>
      {speciesGroups(scores, model?.today.month ?? new Date().getMonth() + 1).map((group) => (
        <Group
          key={group.habitat}
          group={group}
          selected={speciesId}
          metaOf={metaOf}
          onChoose={choose}
        />
      ))}
    </Screen>
  );
}
