import { useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';

import { useColors } from '../theme';
import { motion, radius, shadows, space } from '../tokens';

import type { Hole } from './SpotlightShade';
import { Text } from './Text';

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/* Comes out of the target — down from it, or up from it — once the window has arrived. */
const DROP = FadeInDown.duration(motion.stepIn)
  .delay(motion.spotlight / 2)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
const RISE = FadeInUp.duration(motion.stepIn)
  .delay(motion.spotlight / 2)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
const AWAY = FadeOut.duration(motion.fadeOut).reduceMotion(ReduceMotion.System);

export type BubbleProps = {
  hole: Hole;
  title: string;
  body: string;
  progress: string;
  hint: string;
};

/** The explanation, on whichever side of the target has more room. */
export function Bubble({ hole, title, body, progress, hint }: BubbleProps): React.JSX.Element {
  const colors = useColors();
  const { height } = useWindowDimensions();
  const below = (hole.top + hole.bottom) / 2 < height / 2;
  const side = below ? { top: hole.bottom + space.xl } : { bottom: height - hole.top + space.xl };
  return (
    <Animated.View
      entering={below ? DROP : RISE}
      exiting={AWAY}
      style={{
        position: 'absolute',
        ...side,
        left: space.gap,
        right: space.gap,
        padding: space.gap,
        gap: space.md,
        borderRadius: radius.lg,
        backgroundColor: colors.bg,
        ...shadows.md,
      }}
    >
      <Text variant="caption" color={colors.accent700}>
        {progress}
      </Text>
      <Text variant="h4">{title}</Text>
      <Text variant="body" color={colors.textAlpha[72]}>
        {body}
      </Text>
      <Text variant="metaSm" color={colors.textAlpha[52]}>
        {hint}
      </Text>
    </Animated.View>
  );
}
