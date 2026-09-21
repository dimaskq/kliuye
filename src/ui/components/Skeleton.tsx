import { View } from 'react-native';

import { colors, radius } from '../tokens';

export type SkeletonProps = {
  height: number;
  width?: number | `${number}%`;
  radiusToken?: keyof typeof radius;
};

/** Loading placeholder shaped like the card it replaces, never a full-screen spinner. */
export function Skeleton({
  height,
  width = '100%',
  radiusToken = 'lg',
}: SkeletonProps): React.JSX.Element {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height,
        width,
        borderRadius: radius[radiusToken],
        backgroundColor: colors.textAlpha[8],
      }}
    />
  );
}
