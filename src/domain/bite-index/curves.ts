/** Shared response curves. Every factor shapes its score with these, not ad hoc maths. */

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * 1 at `center`, decaying to 0 at `center ± span`. `exponent` above 1 keeps the
 * peak broad and drops off quickly at the edges.
 */
export function peakCurve(value: number, center: number, span: number, exponent = 1.4): number {
  const distance = Math.abs(value - center) / span;
  if (distance >= 1) return 0;
  return clamp01(1 - Math.pow(distance, exponent));
}

/** 1 anywhere inside `[low, high]`, decaying to 0 `tolerance` beyond either edge. */
export function plateauCurve(
  value: number,
  low: number,
  high: number,
  tolerance: number,
  exponent = 1.5,
): number {
  if (value >= low && value <= high) return 1;
  const distance = (value < low ? low - value : value - high) / tolerance;
  if (distance >= 1) return 0;
  return clamp01(1 - Math.pow(distance, exponent));
}

/** Bell centred on 0; `sigma` is the half-width where the response is ~0.6. */
export function bellCurve(distance: number, sigma: number): number {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma));
}

/** Pulls a raw 0..1 response toward the neutral 0.5 by `1 - strength`. */
export function towardNeutral(raw: number, strength: number): number {
  return clamp01(0.5 + (raw - 0.5) * clamp01(strength));
}

/** Shortest distance between two hours on a 24 h clock. */
export function hourDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 24;
  return Math.min(raw, 24 - raw);
}

/** Smallest angle, in degrees, between two compass bearings. */
export function bearingDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}
