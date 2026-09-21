import { pressureIn, temperatureIn, windSpeedIn } from '@/domain/units';
import type { UnitSystem } from '@/domain/units';

/** Presentation-only formatting. Unit maths stays in `@/domain/units`. */

export function pad2(value: number): string {
  return String(Math.floor(value)).padStart(2, '0');
}

/** 5.68 → "05:41". */
export function formatClock(hour: number): string {
  const whole = Math.floor(hour);
  return `${pad2(whole)}:${pad2(Math.round((hour - whole) * 60))}`;
}

/** 6 → "06:00" — used for the hourly chart and the best-window pill. */
export function formatHour(hour: number): string {
  return `${pad2(hour)}:00`;
}

/** Temperatures always carry their sign, as on the factor cards. */
export function formatTemperature(system: UnitSystem, celsius: number): string {
  const value = Math.round(temperatureIn(system, celsius));
  return value > 0 ? `+${value}` : String(value);
}

/** Signed, one decimal — for the "+1.5° in 24 h" style notes. */
export function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

export function formatPressure(system: UnitSystem, hPa: number): string {
  const value = pressureIn(system, hPa);
  return system === 'metric' ? String(Math.round(value)) : value.toFixed(2);
}

export function formatWindSpeed(system: UnitSystem, metresPerSecond: number): string {
  return String(Math.round(windSpeedIn(system, metresPerSecond)));
}

export function formatPercent(value: number): string {
  return String(Math.round(value));
}

const BYTES_IN_MEGABYTE = 1024 * 1024;

/** Cache sizes are read at a glance, so one decimal is the whole story. */
export function formatMegabytes(bytes: number): string {
  return (bytes / BYTES_IN_MEGABYTE).toFixed(1);
}
