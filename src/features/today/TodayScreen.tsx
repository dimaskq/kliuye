import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentForecast, useSpeciesScores, useSpotLabel } from '@/hooks';
import { useDateFormat } from '@/hooks/useDateFormat';
import { errorMessageKey } from '@/services/errors';
import { useSelection } from '@/store';
import { Screen, StaleBadge, StatusCard, screenPadding, space, MIN_TOUCH_SIZE } from '@/ui';

import { LocationPrompt, RefreshBanner } from './components';
import { TodayContent } from './TodayContent';
import { TodayHeader } from './TodayHeader';
import { TodaySkeleton } from './TodaySkeleton';
import { useReload } from './useRefreshPhase';
import type { RefreshPhase } from './useRefreshPhase';

/** Floats just under the header, over the index card, so nothing below it moves. */
const BELOW_HEADER = screenPadding.today.paddingTop + MIN_TOUCH_SIZE + space.xl;

function RefreshStatus({
  phase,
  failed,
}: {
  phase: RefreshPhase;
  failed: boolean;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const done = phase === 'done';
  const label = done ? (failed ? t('error.title') : t('today.refreshed')) : t('today.refreshing');
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: insets.top + BELOW_HEADER }}
    >
      {phase === 'idle' ? null : (
        <RefreshBanner phase={phase} label={label} failed={done && failed} />
      )}
    </View>
  );
}

/** No forecast and no cache: say why, and offer another try. */
function ForecastError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen padding="today">
      <StatusCard
        title={t('error.title')}
        body={t(errorMessageKey(error))}
        actionLabel={t('common.retry')}
        onAction={onRetry}
      />
    </Screen>
  );
}

/** Answers the one question: is it worth going out today? */
export function TodayScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const dates = useDateFormat();
  const labelOf = useSpotLabel();
  const { speciesId, selectedHour, setSpecies, setHour, stepHour } = useSelection();
  const forecastState = useCurrentForecast();
  const { spot, model, forecast, isLoading, isRefreshing, error, isStale, refetch } = forecastState;
  const speciesScores = useSpeciesScores(forecast, spot, selectedHour);
  const { phase: refreshPhase, reloading, reload } = useReload(isRefreshing, refetch);

  if (isLoading) return <TodaySkeleton />;

  if (model === undefined || forecast === undefined) {
    return <ForecastError error={error} onRetry={refetch} />;
  }

  const fetchedAt = new Date(forecast.fetchedAt);
  const label = labelOf(spot);

  return (
    <View style={{ flex: 1 }}>
      <Screen padding="today" gap={18} onRefresh={reload} refreshing={reloading}>
        <TodayHeader
          spotName={label.name}
          subtitle={`${label.region} · ${dates.longDate(fetchedAt)} · ${dates.time(fetchedAt)}`}
          refreshing={reloading}
          onRefresh={reload}
        />
        {forecastState.canOfferLocation ? <LocationPrompt /> : null}
        {isStale ? (
          <StaleBadge label={t('common.staleData', { time: dates.time(fetchedAt) })} />
        ) : null}
        <TodayContent
          model={model}
          speciesId={speciesId}
          speciesScores={speciesScores}
          selectedHour={selectedHour}
          onSelectSpecies={setSpecies}
          onSelectHour={setHour}
          onStepHour={stepHour}
        />
      </Screen>
      <RefreshStatus phase={refreshPhase} failed={error !== undefined} />
    </View>
  );
}
