import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { byNewest, catchStats, filesOf } from '@/domain/diary';
import type { Catch } from '@/domain/diary';
import { pruneOrphans } from '@/services/media';
import { useDiary } from '@/store';
import { Button, Screen, StatusCard, Text, colors, space } from '@/ui';

import { CatchRow } from './components';
import { useCatchLabels } from './useCatchLabels';

function Summary({ catches }: { catches: readonly Catch[] }): React.JSX.Element {
  const { t } = useTranslation();
  const { fish, trips, recordKg } = catchStats(catches);
  return (
    <Text variant="emphasis" color={colors.textAlpha[55]}>
      {t('diary.summary', {
        fish: t('profile.fish', { count: fish }),
        trips: t('profile.trips', { count: trips }),
        record: recordKg > 0 ? t('diary.kg', { value: recordKg.toFixed(1) }) : '—',
      })}
    </Text>
  );
}

/** The angler's own record of what they caught. Local only, never uploaded. */
export function DiaryScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const catches = useDiary((state) => state.catches);
  const labels = useCatchLabels();

  /* Photos picked into a form the angler then abandoned belong to no entry.
     Opening the journal is the natural moment to sweep them up. */
  useEffect(() => {
    pruneOrphans(useDiary.getState().catches.flatMap((entry) => filesOf(entry.media)));
  }, []);

  const openEntry = (id: string): void => router.push({ pathname: '/catch', params: { id } });

  return (
    <Screen gap={space.gap}>
      <View style={{ gap: space.xs }}>
        <Text variant="h2" accessibilityRole="header">
          {t('diary.title')}
        </Text>
        {catches.length === 0 ? (
          <Text variant="emphasis" color={colors.textAlpha[55]}>
            {t('diary.subtitle')}
          </Text>
        ) : (
          <Summary catches={catches} />
        )}
      </View>
      <Button label={t('diary.add')} onPress={() => router.push('/catch')} />
      {catches.length === 0 ? (
        <StatusCard title={t('diary.emptyTitle')} body={t('diary.emptyBody')} />
      ) : (
        <View style={{ gap: space.lg }}>
          {byNewest(catches).map((entry) => (
            <CatchRow
              key={entry.id}
              species={labels.species(entry.speciesId)}
              weight={labels.weight(entry.weightKg)}
              weighed={entry.weightKg > 0}
              date={labels.day(entry.caughtAt)}
              place={entry.place}
              note={entry.note}
              media={entry.media}
              accessibilityLabel={labels.row(entry)}
              onPress={() => openEntry(entry.id)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
