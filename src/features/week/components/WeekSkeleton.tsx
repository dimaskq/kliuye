import { View } from 'react-native';

import { Screen, Skeleton, space } from '@/ui';

const ROW_HEIGHT = 76;
const DAY_COUNT = 7;

/** Seven row-shaped placeholders while the first forecast arrives. */
export function WeekSkeleton(): React.JSX.Element {
  return (
    <Screen>
      <Skeleton height={64} radiusToken="row" />
      <View style={{ gap: space.lg }}>
        {Array.from({ length: DAY_COUNT }, (_, index) => (
          <Skeleton key={index} height={ROW_HEIGHT} radiusToken="row" />
        ))}
      </View>
    </Screen>
  );
}
