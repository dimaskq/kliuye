import { View } from 'react-native';

import { Screen, Skeleton, sizes, space } from '@/ui';

const RING_CARD_HEIGHT = 380;
const CHART_CARD_HEIGHT = 176;
const FACTOR_CARD_HEIGHT = 96;
const FACTOR_COUNT = 8;

/** Placeholders shaped like the real cards, not a spinner over the whole screen. */
export function TodaySkeleton(): React.JSX.Element {
  return (
    <Screen padding="today" gap={18}>
      <Skeleton height={44} radiusToken="row" />
      <Skeleton height={RING_CARD_HEIGHT} />
      <Skeleton height={sizes.tabPill.height + space.gap} radiusToken="pill" />
      <Skeleton height={CHART_CARD_HEIGHT} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
        {Array.from({ length: FACTOR_COUNT }, (_, index) => (
          <View key={index} style={{ flexGrow: 1, flexBasis: '47%' }}>
            <Skeleton height={FACTOR_CARD_HEIGHT} radiusToken="factorCard" />
          </View>
        ))}
      </View>
    </Screen>
  );
}
