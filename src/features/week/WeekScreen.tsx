import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useCurrentForecast } from '@/hooks';
import { useDateFormat } from '@/hooks/useDateFormat';
import type { DateFormatter } from '@/hooks/useDateFormat';
import { errorMessageKey } from '@/services/errors';
import { usePreferences, useSelection } from '@/store';
import { Screen, StatusCard, Text, colors, space } from '@/ui';

import { DayRow, WeekSkeleton } from './components';
import { toDayRows } from './dayRows';
import type { DayRowModel } from './dayRows';

type DayListProps = {
  rows: readonly DayRowModel[];
  dates: DateFormatter;
  expandedIndex: number;
  onToggle: (index: number) => void;
};

function DayList({ rows, dates, expandedIndex, onToggle }: DayListProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={{ gap: space.lg }}>
      {rows.map((row, index) => (
        <DayRow
          key={row.date.toISOString()}
          row={row}
          weekday={dates.weekday(row.date)}
          shortDate={dates.shortDate(row.date)}
          expanded={index === expandedIndex}
          accessibilityLabel={t('week.dayAccessible', {
            day: dates.weekday(row.date),
            date: dates.shortDate(row.date),
            value: row.value,
            summary: row.summary,
          })}
          onPress={() => onToggle(index)}
        />
      ))}
    </View>
  );
}

/** Seven days of index, each expandable into its window, wind, pressure and moon. */
export function WeekScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const dates = useDateFormat();
  const unitSystem = usePreferences((state) => state.unitSystem);
  const speciesId = useSelection((state) => state.speciesId);
  const selectedDayIndex = useSelection((state) => state.selectedDayIndex);
  const toggleDay = useSelection((state) => state.toggleDay);
  const { model, forecast, isLoading, isRefreshing, error, refetch } = useCurrentForecast();

  if (isLoading) return <WeekSkeleton />;

  if (model === undefined || forecast === undefined) {
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
          {t('week.title')}
        </Text>
        <Text variant="emphasis" color={colors.textAlpha[55]}>
          {t('week.subtitle', { species: t(`species.${speciesId}`) })}
        </Text>
      </View>
      <DayList
        rows={toDayRows(model.week, forecast.days, unitSystem, t)}
        dates={dates}
        expandedIndex={selectedDayIndex}
        onToggle={toggleDay}
      />
      <Text variant="metaSm" color={colors.textAlpha[50]}>
        {t('week.hint')}
      </Text>
    </Screen>
  );
}
