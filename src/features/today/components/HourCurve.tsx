import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { clampForDisplay, colors, scoreFill, sizes } from '@/ui';

import { areaPath, chartPoints, smoothPath } from './curvePath';

export type HourCurveProps = {
  curve: readonly number[];
  selectedHour: number;
  width: number;
};

const STROKE_WIDTH = 2.5;
const MARKER_RADIUS = 6;
const MARKER_RING = 2.5;
const FILL_OPACITY = 0.5;
const GRADIENT_ID = 'hourly-curve';

function RampGradient({ curve }: { curve: readonly number[] }): React.JSX.Element {
  const span = Math.max(1, curve.length - 1);
  return (
    <Defs>
      <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
        {curve.map((value, hour) => (
          <Stop
            key={hour}
            offset={hour / span}
            stopColor={scoreFill(clampForDisplay(value))}
            stopOpacity={1}
          />
        ))}
      </LinearGradient>
    </Defs>
  );
}

function Marker({
  x,
  y,
  baselineY,
  fill,
}: {
  x: number;
  y: number;
  baselineY: number;
  fill: string;
}) {
  return (
    <>
      <Line
        x1={x}
        y1={y}
        x2={x}
        y2={baselineY}
        stroke={colors.accent900}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      <Circle cx={x} cy={y} r={MARKER_RADIUS + MARKER_RING} fill={colors.surface} />
      <Circle
        cx={x}
        cy={y}
        r={MARKER_RADIUS}
        fill={fill}
        stroke={colors.accent900}
        strokeWidth={1.5}
      />
    </>
  );
}

/**
 * The day as one line. The gradient under it carries the index ramp, so colour
 * still says how good each hour is without cutting the day into 24 columns.
 */
export function HourCurve({
  curve,
  selectedHour,
  width,
}: HourCurveProps): React.JSX.Element | null {
  const height = sizes.hourChartHeight;
  const points = chartPoints(curve, width, height);
  const marker = points[selectedHour];
  if (marker === undefined) return null;

  return (
    <Svg width={width} height={height}>
      <RampGradient curve={curve} />
      <Path d={areaPath(points, height)} fill={`url(#${GRADIENT_ID})`} fillOpacity={FILL_OPACITY} />
      <Path
        d={smoothPath(points)}
        stroke={`url(#${GRADIENT_ID})`}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeLinecap="round"
      />
      <Marker
        x={marker.x}
        y={marker.y}
        baselineY={height}
        fill={scoreFill(clampForDisplay(curve[selectedHour] ?? 0))}
      />
    </Svg>
  );
}
