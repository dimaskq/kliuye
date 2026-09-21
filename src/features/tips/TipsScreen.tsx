import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Tip } from '@/domain/tips';
import { useCurrentForecast } from '@/hooks';
import { errorMessageKey } from '@/services/errors';
import { Screen, StatusCard, Text, colors } from '@/ui';

import { TipRow } from './components';
import { TipsSkeleton } from './TipsSkeleton';

/** The first two tips are the strongest signals, and are badged accordingly. */
const EMPHASISED_COUNT = 2;

function TipList({ tips }: { tips: readonly Tip[] }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 11 }}>
      {tips.map((tip, index) => (
        <TipRow
          key={tip.id}
          index={index + 1}
          kicker={t(tip.kickerKey, tip.kickerParams)}
          title={t(tip.titleKey)}
          body={t(tip.bodyKey)}
          category={t(tip.categoryKey)}
          species={t(tip.speciesKey)}
          emphasised={index < EMPHASISED_COUNT}
        />
      ))}
    </View>
  );
}

/** Advice derived from the live factors, ordered by how much each one is saying. */
export function TipsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { model, isLoading, isRefreshing, error, refetch } = useCurrentForecast();

  if (isLoading) return <TipsSkeleton />;

  if (model === undefined) {
    return (
      <Screen>
        <StatusCard
          title={t('error.title')}
          body={t(errorMessageKey(error))}
          actionLabel={t('common.retry')}
          onAction={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={refetch} refreshing={isRefreshing}>
      <View>
        <Text variant="h2" accessibilityRole="header">
          {t('tips.title')}
        </Text>
        <Text variant="emphasis" color={colors.textAlpha[55]}>
          {t('tips.subtitle')}
        </Text>
      </View>
      <TipList tips={model.tips} />
    </Screen>
  );
}
