export type Point = { x: number; y: number };

/** Keeps the stroke and the peak inside the box. */
const TOP_PADDING = 6;
const MIN_VALUE = 0;
const MAX_VALUE = 100;
/**
 * A day whose index moves between 73 and 84 would be a flat line on a 0–100
 * axis, and the shape of the day is the whole point of this chart. The axis
 * follows the day's own range instead — never narrower than this, so a genuinely
 * flat day is not amplified into drama.
 */
const MIN_SPAN = 25;
/** Catmull-Rom tension as cubic Béziers: a sixth of the neighbouring span. */
const CONTROL_RATIO = 6;

export type ValueRange = { min: number; max: number };

/** The vertical window the curve is drawn in: the day's own range, widened. */
export function valueRange(curve: readonly number[]): ValueRange {
  if (curve.length === 0) return { min: MIN_VALUE, max: MAX_VALUE };
  const low = Math.min(...curve);
  const high = Math.max(...curve);
  const short = Math.max(0, MIN_SPAN - (high - low)) / 2;
  const min = Math.max(MIN_VALUE, low - short);
  return { min, max: Math.min(MAX_VALUE, Math.max(min + MIN_SPAN, high + short)) };
}

/** Evenly spaced across the width; the range's floor sits on the baseline. */
export function chartPoints(curve: readonly number[], width: number, height: number): Point[] {
  if (curve.length === 0 || width <= 0) return [];
  const step = curve.length === 1 ? 1 : curve.length - 1;
  const plot = Math.max(0, height - TOP_PADDING);
  const { min, max } = valueRange(curve);
  const span = Math.max(1, max - min);
  return curve.map((value, index) => ({
    x: (index / step) * width,
    y: height - Math.max(0, Math.min(1, (value - min) / span)) * plot,
  }));
}

function at(points: readonly Point[], index: number): Point {
  return points[Math.max(0, Math.min(points.length - 1, index))]!;
}

/**
 * A Catmull-Rom spline through every point, emitted as cubic Béziers: the day's
 * shape reads as one continuous line rather than 24 separate columns.
 */
export function smoothPath(points: readonly Point[]): string {
  const [first] = points;
  if (first === undefined) return '';

  let path = `M${first.x} ${first.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = at(points, index - 1);
    const start = at(points, index);
    const end = at(points, index + 1);
    const next = at(points, index + 2);
    const control1 = {
      x: start.x + (end.x - previous.x) / CONTROL_RATIO,
      y: start.y + (end.y - previous.y) / CONTROL_RATIO,
    };
    const control2 = {
      x: end.x - (next.x - start.x) / CONTROL_RATIO,
      y: end.y - (next.y - start.y) / CONTROL_RATIO,
    };
    path += `C${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
  }
  return path;
}

/** The same curve, closed down to the baseline, for the filled area. */
export function areaPath(points: readonly Point[], baselineY: number): string {
  const line = smoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  if (line === '' || first === undefined || last === undefined) return '';
  return `${line}L${last.x} ${baselineY}L${first.x} ${baselineY}Z`;
}
