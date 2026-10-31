import { View } from 'react-native';

import { IconButton, Text, space, MIN_TOUCH_SIZE, useColors } from '@/ui';

const STEP = {
  size: MIN_TOUCH_SIZE - space.md,
} as const;

export type HourStepperProps = {
  time: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
};

/** Hour-by-hour stepping, for when a fingertip is too blunt for the curve. */
export function HourStepper({
  time,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: HourStepperProps): React.JSX.Element {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <IconButton
        {...STEP}
        background={colors.bg}
        color={colors.accent700}
        icon="chevron-left"
        label={previousLabel}
        onPress={onPrevious}
      />
      <Text variant="emphasis" color={colors.accent700} align="center" style={{ minWidth: 44 }}>
        {time}
      </Text>
      <IconButton
        {...STEP}
        background={colors.bg}
        color={colors.accent700}
        icon="chevron-right"
        label={nextLabel}
        onPress={onNext}
      />
    </View>
  );
}
