import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { pointKey } from '@/domain/geo';
import { CUSTOM_SPOT_ID } from '@/domain/spots';
import type { CustomPoint } from '@/domain/spots';
import { useChoosePoint } from '@/hooks';
import { includesPoint, usePoints, useSelection } from '@/store';
import { Dialog, Segmented } from '@/ui';

import { PointList } from './PointList';

type TabId = 'favourites' | 'recent';

/** Tall enough for five rows; longer lists scroll inside the card. */
const LIST_MAX_HEIGHT = 380;

export type PlacesDialogProps = {
  visible: boolean;
  onClose: () => void;
};

/** The remembered point being forecast for right now, if any. */
function useActivePointKey(): string | undefined {
  const { selectedSpotId, customPoint } = useSelection();
  return selectedSpotId === CUSTOM_SPOT_ID && customPoint !== undefined
    ? pointKey(customPoint)
    : undefined;
}

/**
 * The places the angler kept, and the ones picked lately. Saved come first.
 * Choosing one makes it the active place and closes the list — the same on
 * every screen that offers it.
 */
export function PlacesDialog({ visible, onClose }: PlacesDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const choosePoint = useChoosePoint();
  const activeKey = useActivePointKey();
  const onChoose = (point: CustomPoint): void => {
    onClose();
    choosePoint(point);
  };
  const { recent, favourites, toggleFavourite } = usePoints();
  const [tab, setTab] = useState<TabId>('favourites');
  const isRecent = tab === 'recent';

  return (
    <Dialog
      visible={visible}
      closeLabel={t('common.close')}
      title={t('map.placesTitle')}
      onClose={onClose}
    >
      <Segmented
        segments={[
          { id: 'favourites', label: t('map.tabFavourites'), count: favourites.length },
          { id: 'recent', label: t('map.tabRecent'), count: recent.length },
        ]}
        selectedId={tab}
        onSelect={(id) => setTab(id as TabId)}
      />
      <ScrollView style={{ maxHeight: LIST_MAX_HEIGHT }} showsVerticalScrollIndicator={false}>
        <PointList
          points={isRecent ? recent : favourites}
          activeKey={activeKey}
          isFavourite={(point) => includesPoint(favourites, point)}
          onChoose={onChoose}
          onToggleFavourite={toggleFavourite}
          emptyTitle={t(isRecent ? 'map.recentEmptyTitle' : 'map.favouritesEmptyTitle')}
          emptyBody={t(isRecent ? 'map.recentEmptyBody' : 'map.favouritesEmptyBody')}
        />
      </ScrollView>
    </Dialog>
  );
}
