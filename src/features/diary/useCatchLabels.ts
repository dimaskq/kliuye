import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { SpeciesId } from '@/domain/bite-index';
import { dayOf } from '@/domain/diary';
import type { Catch } from '@/domain/diary';
import { useDateFormat, useNow } from '@/hooks';

const NO_WEIGHT = '—';

export type CatchLabels = {
  /** "Сьогодні", "Вчора", or the full date for anything older. */
  day: (timestamp: number) => string;
  weight: (weightKg: number) => string;
  species: (id: SpeciesId) => string;
  row: (entry: Catch) => string;
};

/** The screen reader hears the photos too, since it cannot see the thumbnails. */
function rowLabel(t: TFunction, entry: Catch, parts: Record<string, string>): string {
  if (entry.media.length === 0) return t('diary.rowAccessible', parts);
  return t('diary.rowWithMedia', {
    ...parts,
    media: t('diary.photos', { count: entry.media.length }),
  });
}

/** Every string a diary entry needs, in one place and in one language. */
export function useCatchLabels(): CatchLabels {
  const { t } = useTranslation();
  const { longDate } = useDateFormat();
  const now = useNow();

  const day = (timestamp: number): string => {
    const distance = dayOf(now) - dayOf(timestamp);
    if (distance === 0) return t('diary.today');
    if (distance === 1) return t('diary.yesterday');
    return longDate(new Date(timestamp));
  };

  const weight = (weightKg: number): string =>
    weightKg === 0 ? NO_WEIGHT : t('diary.kg', { value: weightKg.toFixed(1) });

  const species = (id: SpeciesId): string => t(`species.${id}`);

  return {
    day,
    weight,
    species,
    row: (entry) =>
      rowLabel(t, entry, {
        species: species(entry.speciesId),
        weight: weight(entry.weightKg),
        day: day(entry.caughtAt),
        place: entry.place,
      }),
  };
}
