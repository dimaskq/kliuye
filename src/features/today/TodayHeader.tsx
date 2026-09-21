import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlacesDialog } from '@/features/map';

import { LocationHeader } from './components';

export type TodayHeaderProps = {
  spotName: string;
  subtitle: string;
  refreshing: boolean;
  onRefresh: () => void;
};

/** The place, and the ways to change it, reload it or jump to a saved one. */
export function TodayHeader({
  spotName,
  subtitle,
  refreshing,
  onRefresh,
}: TodayHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [placesOpen, setPlacesOpen] = useState(false);

  return (
    <>
      <LocationHeader
        spotName={spotName}
        subtitle={subtitle}
        changeHint={t('today.changePlace')}
        settingsLabel={t('profile.about')}
        placesLabel={t('today.myPlaces')}
        refreshLabel={t('today.refresh')}
        refreshing={refreshing}
        onChangeSpot={() => router.push('/map')}
        onOpenSettings={() => router.push('/settings')}
        onOpenPlaces={() => setPlacesOpen(true)}
        onRefresh={onRefresh}
      />
      <PlacesDialog visible={placesOpen} onClose={() => setPlacesOpen(false)} />
    </>
  );
}
