import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FactorWeights } from '@/features/about';
import { usePreferences } from '@/store';
import { Button, Icon, Text, iconSize, radius, space, MIN_TOUCH_SIZE, useColors } from '@/ui';
import type { IconName } from '@/ui';

import { BADGE_IN, Dot, STEP_IN, STEP_OUT } from './motion';

/** Four steps: what this is, where to tap, how to read it, what comes next. */
const STEPS: readonly { key: string; icon: IconName }[] = [
  { key: 'welcome', icon: 'fish' },
  { key: 'point', icon: 'map-pin' },
  { key: 'index', icon: 'gauge' },
  { key: 'more', icon: 'route' },
];

const BADGE = 88;

function Dots({ current }: { current: number }): React.JSX.Element {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', justifyContent: 'center', gap: space.sm }}
    >
      {STEPS.map((step, index) => (
        <Dot key={step.key} active={index === current} />
      ))}
    </View>
  );
}

function SkipRow({ hidden, onSkip }: { hidden: boolean; onSkip: () => void }) {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <View style={{ alignItems: 'flex-end', minHeight: MIN_TOUCH_SIZE }}>
      {hidden ? null : (
        <Pressable
          accessibilityRole="button"
          onPress={onSkip}
          style={{ minHeight: MIN_TOUCH_SIZE, justifyContent: 'center' }}
        >
          <Text variant="label" color={colors.textAlpha[55]}>
            {t('onboarding.skip')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function StepBody({ step }: { step: (typeof STEPS)[number] }): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <Animated.View
      entering={STEP_IN}
      exiting={STEP_OUT}
      /* Absolute, so the step leaving and the step arriving overlap, not stack. */
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        justifyContent: 'center',
        gap: space.gap,
      }}
    >
      <Animated.View
        entering={BADGE_IN}
        style={{
          width: BADGE,
          height: BADGE,
          borderRadius: radius.pill,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
        }}
      >
        <Icon name={step.icon} size={iconSize.action * 2} color={colors.onAccent} />
      </Animated.View>
      <Text variant="h2" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {t(`onboarding.${step.key}.title`)}
      </Text>
      <Text variant="body" color={colors.textAlpha[72]} style={{ textAlign: 'center' }}>
        {t(`onboarding.${step.key}.body`)}
      </Text>
      {/* The question every tester asked first: where does the number come from? */}
      {step.key === 'index' ? <FactorWeights /> : null}
    </Animated.View>
  );
}

type FooterProps = { index: number; onNext: () => void; onFinish: () => void };

function Footer({ index, onNext, onFinish }: FooterProps): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  const last = index === STEPS.length - 1;
  return (
    <View style={{ gap: space.gap }}>
      <Dots current={index} />
      <Text variant="caption" color={colors.textAlpha[52]} style={{ textAlign: 'center' }}>
        {t('onboarding.progress', { step: index + 1, total: STEPS.length })}
      </Text>
      <Button
        label={last ? t('onboarding.start') : t('onboarding.next')}
        onPress={last ? onFinish : onNext}
      />
    </View>
  );
}

/**
 * A short tour on first launch. Testers opened the app, saw a map and a number,
 * and did not know what to do with either; four screens answer that before the
 * first question is asked. Skipping is always one tap away.
 */
export function OnboardingTour(): React.JSX.Element {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const visible = usePreferences((state) => state.hydrated && !state.onboardingDone);
  const finish = usePreferences((state) => state.finishOnboarding);
  const [index, setIndex] = useState(0);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={finish} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + space.md,
          paddingBottom: insets.bottom + space.gap,
          paddingHorizontal: space.gap,
        }}
      >
        <SkipRow hidden={index === STEPS.length - 1} onSkip={finish} />
        <View style={{ flex: 1 }}>
          <StepBody key={index} step={STEPS[index] ?? STEPS[0]!} />
        </View>
        <Footer index={index} onNext={() => setIndex(index + 1)} onFinish={finish} />
      </View>
    </Modal>
  );
}
