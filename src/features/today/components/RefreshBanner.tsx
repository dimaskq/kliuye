import { ActivityIndicator } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

import { Icon, Text, colors, iconSize, motion, radius, shadows, space } from '@/ui';

export type RefreshBannerProps = {
  phase: 'loading' | 'done';
  label: string;
  /** The reload finished but failed; the old forecast is still on screen. */
  failed: boolean;
};

/* With reduced motion the OS setting wins and the pill simply appears. */
const REDUCE = ReduceMotion.System;
const slideIn = FadeInDown.duration(motion.toastIn).reduceMotion(REDUCE);
const slideOut = FadeOutUp.duration(motion.toastOut).reduceMotion(REDUCE);
const swapIn = FadeIn.duration(motion.toastIn).reduceMotion(REDUCE);
/* The two labels differ in length; the pill eases to the new width. */
const resize = LinearTransition.duration(motion.toastIn).reduceMotion(REDUCE);

/**
 * Says a reload is under way, then how it ended — loud enough to notice. It
 * glides down into view and back up out of it, never jolting the page.
 */
export function RefreshBanner({ phase, label, failed }: RefreshBannerProps): React.JSX.Element {
  const loading = phase === 'loading';
  return (
    <Animated.View
      entering={slideIn}
      exiting={slideOut}
      layout={resize}
      accessibilityRole="text"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: space.md,
        backgroundColor: failed ? colors.accent100 : colors.text,
        borderRadius: radius.pill,
        paddingVertical: space.md,
        paddingHorizontal: space.h,
        ...shadows.md,
      }}
    >
      {/* Keyed by state, so "updating" fades into "updated" instead of snapping. */}
      <Animated.View
        key={`${phase}-${failed}`}
        entering={swapIn}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.lure} />
        ) : (
          <Icon
            name={failed ? 'x' : 'check'}
            size={iconSize.action}
            color={failed ? colors.accent700 : colors.lure}
          />
        )}
        <Text variant="label" color={failed ? colors.accent800 : colors.bg}>
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
