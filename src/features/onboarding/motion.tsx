import { useEffect } from 'react';
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  ReduceMotion,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, radius, useColors } from '@/ui';

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/** A step slides in from the right as the last one leaves to the left. */
export const STEP_IN = FadeInRight.duration(motion.stepIn)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
export const STEP_OUT = FadeOutLeft.duration(motion.fadeOut * 1.5).reduceMotion(
  ReduceMotion.System,
);

/** The round badge pops in just after its step, with a little bounce. */
export const BADGE_IN = ZoomIn.springify()
  .damping(14)
  .stiffness(180)
  .delay(motion.fadeOut)
  .reduceMotion(ReduceMotion.System);

const DOT = 8;

/** A progress dot that stretches into a bar while its step is showing. */
export function Dot({ active }: { active: boolean }): React.JSX.Element {
  const colors = useColors();
  const on = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(active ? 1 : 0, {
      duration: motion.expand,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.System,
    });
  }, [active, on]);
  const stretch = useAnimatedStyle(() => ({ width: DOT + DOT * 2 * on.value }));
  return (
    <Animated.View
      style={[
        {
          height: DOT,
          borderRadius: radius.pill,
          backgroundColor: active ? colors.accent : colors.textAlpha[20],
        },
        stretch,
      ]}
    />
  );
}
