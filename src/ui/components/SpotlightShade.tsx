import { useEffect } from 'react';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { useColors } from '../theme';
import { motion, radius } from '../tokens';

export type Hole = { top: number; left: number; right: number; bottom: number };

const RING = 2;

const GLIDE = {
  duration: motion.spotlight,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
  reduceMotion: ReduceMotion.System,
} as const;

type Edges = Record<keyof Hole, SharedValue<number>>;

/** The four edges of the window, gliding to each new target on the UI thread. */
function useEdges(hole: Hole): Edges {
  const top = useSharedValue(hole.top);
  const left = useSharedValue(hole.left);
  const right = useSharedValue(hole.right);
  const bottom = useSharedValue(hole.bottom);
  useEffect(() => {
    top.value = withTiming(hole.top, GLIDE);
    left.value = withTiming(hole.left, GLIDE);
    right.value = withTiming(hole.right, GLIDE);
    bottom.value = withTiming(hole.bottom, GLIDE);
  }, [bottom, hole.bottom, hole.left, hole.right, hole.top, left, right, top]);
  return { top, left, right, bottom };
}

/** A slow breath on the ring, so the eye finds it; still under Reduce Motion. */
function useBreath(): SharedValue<number> {
  const breath = useSharedValue(1);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(0.4, {
        duration: motion.pulse,
        easing: Easing.inOut(Easing.sin),
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true,
    );
  }, [breath]);
  return breath;
}

/**
 * The screen dimmed everywhere but a window over the target: four strips
 * around it, and a ring. Only the edges move — no re-render per frame.
 */
export function Shade({ hole }: { hole: Hole }): React.JSX.Element {
  const colors = useColors();
  const { top, left, right, bottom } = useEdges(hole);
  const breath = useBreath();
  const dim = { position: 'absolute', backgroundColor: colors.scrim } as const;

  const above = useAnimatedStyle(() => ({ height: top.value }));
  const below = useAnimatedStyle(() => ({ top: bottom.value }));
  const before = useAnimatedStyle(() => ({
    top: top.value,
    height: bottom.value - top.value,
    width: left.value,
  }));
  const after = useAnimatedStyle(() => ({
    top: top.value,
    height: bottom.value - top.value,
    left: right.value,
  }));
  const ring = useAnimatedStyle(() => ({
    top: top.value,
    left: left.value,
    width: right.value - left.value,
    height: bottom.value - top.value,
    opacity: breath.value,
  }));

  return (
    <>
      <Animated.View style={[dim, { top: 0, left: 0, right: 0 }, above]} />
      <Animated.View style={[dim, { left: 0, right: 0, bottom: 0 }, below]} />
      <Animated.View style={[dim, { left: 0 }, before]} />
      <Animated.View style={[dim, { right: 0 }, after]} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            borderWidth: RING,
            borderColor: colors.lure,
            borderRadius: radius.md,
          },
          ring,
        ]}
      />
    </>
  );
}
