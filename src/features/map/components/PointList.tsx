import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { pointKey } from '@/domain/geo';
import type { CustomPoint } from '@/domain/spots';
import { StatusCard, space } from '@/ui';

import { PointRow } from './PointRow';

export type PointListProps = {
  points: readonly CustomPoint[];
  /** The point currently being forecast for, if it is one of these. */
  activeKey: string | undefined;
  isFavourite: (point: CustomPoint) => boolean;
  onChoose: (point: CustomPoint) => void;
  onToggleFavourite: (point: CustomPoint) => void;
  emptyTitle: string;
  emptyBody: string;
};

/** Recently picked or saved places; empty until the angler has picked some. */
export function PointList({
  points,
  activeKey,
  isFavourite,
  onChoose,
  onToggleFavourite,
  emptyTitle,
  emptyBody,
}: PointListProps): React.JSX.Element {
  const { t } = useTranslation();

  if (points.length === 0) return <StatusCard title={emptyTitle} body={emptyBody} />;

  return (
    <View style={{ gap: space.lg }}>
      {points.map((point) => {
        const favourite = isFavourite(point);
        return (
          <PointRow
            key={pointKey(point)}
            point={point}
            fallbackName={t('spots.custom.unnamed')}
            selected={pointKey(point) === activeKey}
            favourite={favourite}
            favouriteLabel={t(favourite ? 'map.unfavourite' : 'map.favourite')}
            onPress={() => onChoose(point)}
            onToggleFavourite={() => onToggleFavourite(point)}
          />
        );
      })}
    </View>
  );
}
