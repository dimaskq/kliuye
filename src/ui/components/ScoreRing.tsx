import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useReduceMotion } from '@/hooks/useReduceMotion';

import { clampForDisplay, scoreFill } from '../scoreColor';
import { colors, motion, sizes } from '../tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CENTER = sizes.ring / 2;

const FRAME = {
  width: sizes.ring,
  height: sizes.ring,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export type ScoreRingProps = {
  /** Logical 0–100 index; clamping for visibility happens inside. */
  value: number;
  children: React.ReactNode;
  /** The unfilled part of the circle; dark cards pass a light track. */
  trackColor?: string;
};

/** The index ring: an SVG arc that fills once, respecting reduce-motion. */
export function ScoreRing({
  value,
  children,
  trackColor = colors.textAlpha[10],
}: ScoreRingProps): React.JSX.Element {
  const reduceMotion = useReduceMotion();
  const shown = clampForDisplay(value);
  const target = sizes.ringCircumference * (1 - shown / 100);
  const offset = useSharedValue<number>(sizes.ringCircumference);

  useEffect(() => {
    offset.value = reduceMotion
      ? target
      : withTiming(target, { duration: motion.ring, easing: Easing.out(Easing.cubic) });
  }, [offset, reduceMotion, target]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <View style={FRAME}>
      <Svg
        width={sizes.ring}
        height={sizes.ring}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={sizes.ringRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={sizes.ringStrokeWidth}
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={CENTER}
          cy={CENTER}
          r={sizes.ringRadius}
          fill="none"
          stroke={scoreFill(shown)}
          strokeWidth={sizes.ringStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={sizes.ringCircumference}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>{children}</View>
    </View>
  );
}
