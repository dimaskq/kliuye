import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useReduceMotion';

import { clampForDisplay, scoreFill } from '../scoreColor';
import { colors, motion, radius, sizes } from '../tokens';

/** Horizontal index bar used in the week list. Decorative: the row is labelled. */
export function ProgressTrack({ value }: { value: number }): React.JSX.Element {
  const reduceMotion = useReduceMotion();
  const shown = clampForDisplay(value);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = reduceMotion
      ? shown
      : withTiming(shown, { duration: motion.bar, easing: Easing.out(Easing.cubic) });
  }, [reduceMotion, shown, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height: sizes.weekTrackHeight,
        borderRadius: radius.pill,
        backgroundColor: colors.textAlpha[9],
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            height: sizes.weekTrackHeight,
            borderRadius: radius.pill,
            backgroundColor: scoreFill(shown),
          },
          fillStyle,
        ]}
      />
    </View>
  );
}
