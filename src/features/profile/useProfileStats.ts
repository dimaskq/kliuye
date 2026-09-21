import { useTranslation } from 'react-i18next';

import type { DailyBiteScore } from '@/domain/bite-index';

import type { Stat } from './components';

const NO_DATA = '—';

function averageIndex(week: readonly DailyBiteScore[] | undefined): string {
  if (week === undefined || week.length === 0) return NO_DATA;
  return String(Math.round(week.reduce((sum, day) => sum + day.value, 0) / week.length));
}

export type ProfileStatsInput = {
  week: readonly DailyBiteScore[] | undefined;
  recordKg: number;
  spotCount: number;
};

/**
 * Every tile is a real local number: the week's own average, the locally logged
 * record, and the size of the bundled catalogue. Nothing is invented.
 */
export function useProfileStats({ week, recordKg, spotCount }: ProfileStatsInput): Stat[] {
  const { t } = useTranslation();
  return [
    { id: 'averageIndex', value: averageIndex(week), label: t('profile.averageIndex') },
    {
      id: 'recordKg',
      value: recordKg > 0 ? recordKg.toFixed(1) : NO_DATA,
      label: t('profile.recordKg'),
    },
    { id: 'spots', value: String(spotCount), label: t('profile.spots') },
  ];
}
