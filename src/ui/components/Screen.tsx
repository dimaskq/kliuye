import { RefreshControl, ScrollView, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, screenPadding, space } from '../tokens';

export type ScreenProps = {
  children: React.ReactNode;
  /** `today` uses a tighter top padding than the other tabs. */
  padding?: keyof typeof screenPadding;
  gap?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Scrollable screen body. Content scrolls rather than clipping, which keeps the
 * layout usable at 200% font scale (STORE_REVIEW.md §7).
 */
export function Screen({
  children,
  padding = 'standard',
  gap = space.h,
  onRefresh,
  refreshing = false,
  contentStyle,
}: ScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        onRefresh === undefined ? undefined : (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        )
      }
    >
      <View style={[screenPadding[padding], { gap }, contentStyle]}>{children}</View>
    </ScrollView>
  );
}
