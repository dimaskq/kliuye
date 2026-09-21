import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PanResponder, View } from 'react-native';

import { Card, Text, colors, sizes, space } from '@/ui';
import { formatHour } from '@/utils/format';

import { HourCurve } from './HourCurve';
import { HourStepper } from './HourStepper';

const AXIS_TICKS = [0, 6, 12, 18, 23];

export type HourlyChartProps = {
  curve: readonly number[];
  selectedHour: number;
  onSelectHour: (hour: number) => void;
  /** Relative moves are the caller's job, so quick taps each land. */
  onStepHour: (delta: number) => void;
};

/** Which hour a finger at `x` is over, given the row's measured width. */
export function hourAt(x: number, width: number, hours: number): number {
  if (width <= 0) return 0;
  return Math.max(0, Math.min(hours - 1, Math.round((x / width) * (hours - 1))));
}

function Axis({ hours }: { hours: number }): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
      {AXIS_TICKS.map((hour) => (
        <Text key={hour} variant="tick" color={colors.textAlpha[38]}>
          {formatHour(Math.min(hour, hours - 1)).slice(0, 2)}
        </Text>
      ))}
    </View>
  );
}

type ChartHeaderProps = {
  hour: number;
  value: number;
  onStepHour: (delta: number) => void;
};

function ChartHeader({ hour, value, onStepHour }: ChartHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: space.md,
        }}
      >
        <Text variant="kicker" accessibilityRole="header">
          {t('today.sectionHourly')}
        </Text>
        <HourStepper
          time={formatHour(hour)}
          previousLabel={t('today.previousHour')}
          nextLabel={t('today.nextHour')}
          onPrevious={() => onStepHour(-1)}
          onNext={() => onStepHour(1)}
        />
      </View>
      <Text
        variant="emphasisSm"
        align="right"
        color={colors.accent700}
        style={{ marginBottom: space.md }}
      >
        {t('today.hourValue', { value })}
      </Text>
    </>
  );
}

type ScrubSurfaceProps = {
  curve: readonly number[];
  selectedHour: number;
  width: number;
  onSelectHour: (hour: number) => void;
  onStepHour: (delta: number) => void;
  onMeasure: (width: number) => void;
};

/**
 * The curve plus the gestures that read it. Announced as adjustable, so a
 * screen reader steps through the day the same way the arrows do.
 */
function ScrubSurface({
  curve,
  selectedHour,
  width,
  onSelectHour,
  onStepHour,
  onMeasure,
}: ScrubSurfaceProps): React.JSX.Element {
  const { t } = useTranslation();
  const value = curve[selectedHour] ?? 0;

  const responder = useMemo(() => {
    const select = (x: number): void => onSelectHour(hourAt(x, width, curve.length));
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      /* Claim the gesture only once it is clearly sideways, so the page still scrolls. */
      onMoveShouldSetPanResponder: (_event, { dx, dy }) => Math.abs(dx) > Math.abs(dy),
      onPanResponderGrant: (event) => select(event.nativeEvent.locationX),
      onPanResponderMove: (event) => select(event.nativeEvent.locationX),
    });
  }, [curve.length, onSelectHour, width]);

  return (
    <View
      {...responder.panHandlers}
      onLayout={(event) => onMeasure(event.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityLabel={t('today.sectionHourly')}
      accessibilityValue={{
        text: t('today.hourAccessible', { hour: formatHour(selectedHour), value }),
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        onStepHour(event.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      style={{ height: sizes.hourChartHeight }}
    >
      <HourCurve curve={curve} selectedHour={selectedHour} width={width} />
    </View>
  );
}

/**
 * The 24-hour curve. Drag along it for a quick read, or step an hour at a time
 * with the arrows — a fingertip covers roughly two hours of this width.
 */
export function HourlyChart({
  curve,
  selectedHour,
  onSelectHour,
  onStepHour,
}: HourlyChartProps): React.JSX.Element {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);

  return (
    <Card
      style={{ paddingTop: space.section, paddingHorizontal: space.h, paddingBottom: space.xxl }}
    >
      <ChartHeader hour={selectedHour} value={curve[selectedHour] ?? 0} onStepHour={onStepHour} />
      <ScrubSurface
        curve={curve}
        selectedHour={selectedHour}
        width={width}
        onSelectHour={onSelectHour}
        onStepHour={onStepHour}
        onMeasure={setWidth}
      />
      <Axis hours={curve.length} />
      <Text variant="caption" color={colors.textAlpha[45]} style={{ marginTop: space.md }}>
        {t('today.hourlyHint')}
      </Text>
    </Card>
  );
}
