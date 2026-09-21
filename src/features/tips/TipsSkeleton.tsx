import { Screen, Skeleton } from '@/ui';

const CARD_HEIGHT = 190;
const PLACEHOLDER_COUNT = 4;

/** Tip-card-shaped placeholders while the first forecast arrives. */
export function TipsSkeleton(): React.JSX.Element {
  return (
    <Screen>
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <Skeleton key={index} height={CARD_HEIGHT} radiusToken="tipCard" />
      ))}
    </Screen>
  );
}
