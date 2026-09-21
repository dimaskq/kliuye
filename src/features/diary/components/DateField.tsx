import { View } from 'react-native';

import { IconButton, Text, colors, radius, space, MIN_TOUCH_SIZE } from '@/ui';

export type DateFieldProps = {
  /** "Сьогодні" or "нд, 30 серпня" — the caller decides which reads better. */
  value: string;
  canGoBack: boolean;
  canGoForward: boolean;
  previousLabel: string;
  nextLabel: string;
  onStep: (delta: number) => void;
};

/** Day-by-day stepper: no modal, and it works the same on every platform. */
export function DateField({
  value,
  canGoBack,
  canGoForward,
  previousLabel,
  nextLabel,
  onStep,
}: DateFieldProps): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.divider,
        paddingHorizontal: space.md,
      }}
    >
      <IconButton
        icon="chevron-left"
        label={previousLabel}
        disabled={!canGoBack}
        size={MIN_TOUCH_SIZE}
        onPress={() => onStep(-1)}
      />
      <Text variant="rowTitle" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
        {value}
      </Text>
      <IconButton
        icon="chevron-right"
        label={nextLabel}
        disabled={!canGoForward}
        size={MIN_TOUCH_SIZE}
        onPress={() => onStep(1)}
      />
    </View>
  );
}
