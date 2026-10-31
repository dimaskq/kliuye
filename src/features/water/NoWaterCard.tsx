import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { StatusCard } from '@/ui';

/**
 * Stands in for the index where there is no water to fish: a number for a
 * field or a desert would only teach the angler that the numbers are random.
 */
export function NoWaterCard(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <StatusCard
      title={t('water.noWaterTitle')}
      body={t('water.noWaterBody')}
      actionLabel={t('water.pickOnMap')}
      onAction={() => router.push('/map')}
    />
  );
}
