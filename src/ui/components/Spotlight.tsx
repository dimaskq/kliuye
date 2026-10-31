import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '../theme';
import { radius, space, MIN_TOUCH_SIZE } from '../tokens';

import { Icon } from './Icon';
import { Bubble } from './SpotlightBubble';
import { Shade } from './SpotlightShade';
import type { Hole } from './SpotlightShade';
import { measureTarget } from './spotlightTargets';
import type { TargetRect } from './spotlightTargets';
import { Text } from './Text';

export type SpotlightStep = {
  /** The `SpotlightTarget` id to light up. */
  target: string;
  title: string;
  body: string;
};

export type SpotlightProps = {
  visible: boolean;
  steps: readonly SpotlightStep[];
  skipLabel: string;
  /** "Step 2 of 7". */
  progressLabel: (step: number, total: number) => string;
  /** "Tap anywhere to go on", and the same for the last step. */
  continueHint: string;
  finishHint: string;
  /** Seen through or skipped: either way the tour is over. */
  onFinish: () => void;
};

/** Breathing room between the target and the ring around it. */
const PAD = 6;
/** The skip button's band at the top; a target inside it sends the button down. */
const SKIP_ZONE = MIN_TOUCH_SIZE + space.gap * 2;

const FILL: ViewStyle = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

function holeOf({ x, y, width, height }: TargetRect): Hole {
  return {
    top: Math.max(0, y - PAD),
    left: Math.max(0, x - PAD),
    right: x + width + PAD,
    bottom: y + height + PAD,
  };
}

type SkipProps = { label: string; atTop: boolean; onPress: () => void };

function SkipButton({ label, atTop, onPress }: SkipProps): React.JSX.Element {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const place = atTop
    ? { top: insets.top + space.md }
    : { bottom: insets.bottom + space.gap + MIN_TOUCH_SIZE };
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        position: 'absolute',
        ...place,
        right: space.gap,
        minHeight: MIN_TOUCH_SIZE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingHorizontal: space.h,
        borderRadius: radius.pill,
        backgroundColor: colors.bg,
      }}
    >
      <Text variant="label">{label}</Text>
      <Icon name="x" size={18} />
    </Pressable>
  );
}

type Found = { target: string; rect: TargetRect };

/**
 * Where the step's target is. A target that is not on screen — a part of the
 * screen this state of it does not show — is passed over with `onMissing`.
 * The last one found stays until the next is measured, so the window glides
 * from one to the other instead of closing in between.
 */
function useStepRect(target: string, visible: boolean, onMissing: () => void): Found | undefined {
  const { height } = useWindowDimensions();
  const [found, setFound] = useState<Found>();
  useEffect(() => {
    if (!visible) return;
    let live = true;
    measureTarget(target, height, (rect) => {
      if (!live) return;
      if (rect === undefined) onMissing();
      else setFound({ target, rect });
    });
    return () => {
      live = false;
    };
  }, [height, onMissing, target, visible]);
  return found;
}

/** Which step is showing; past the last one the tour is over. */
function useStepper(count: number, onFinish: () => void) {
  const [index, setIndex] = useState(0);
  const last = index >= count - 1;
  const advance = useCallback(() => {
    if (last) onFinish();
    else setIndex((current) => current + 1);
  }, [last, onFinish]);
  return { index, last, advance };
}

/**
 * A coach-mark tour: the screen dims, one part of it stays lit with a word on
 * what it does, and a tap anywhere moves on. Skipping is one tap away, always.
 */
export function Spotlight(props: SpotlightProps): React.JSX.Element | null {
  const colors = useColors();
  const { steps, visible, onFinish } = props;
  const insets = useSafeAreaInsets();
  const { index, last, advance } = useStepper(steps.length, onFinish);
  const step = steps[Math.min(index, steps.length - 1)];
  const found = useStepRect(step?.target ?? '', visible && step !== undefined, advance);
  if (step === undefined) return null;
  const hole = found === undefined ? undefined : holeOf(found.rect);
  const hint = last ? props.finishHint : props.continueHint;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFinish}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${step.title}. ${step.body}`}
        accessibilityHint={hint}
        onPress={advance}
        style={FILL}
      >
        {hole === undefined ? (
          <View style={{ ...FILL, backgroundColor: colors.scrim }} />
        ) : (
          <Shade hole={hole} />
        )}
        {hole !== undefined && found?.target === step.target ? (
          /* A new bubble per step: the old one fades as the next comes in. */
          <Bubble
            key={step.target}
            hole={hole}
            title={step.title}
            body={step.body}
            progress={props.progressLabel(index + 1, steps.length)}
            hint={hint}
          />
        ) : null}
      </Pressable>
      <SkipButton
        label={props.skipLabel}
        atTop={hole === undefined || hole.top > insets.top + SKIP_ZONE}
        onPress={onFinish}
      />
    </Modal>
  );
}
