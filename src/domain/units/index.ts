/** Unit conversions live here alone; no screen formats a number by hand. */

export type UnitSystem = 'metric' | 'imperial';

const MM_HG_PER_HPA = 0.750_063_755_419_211;
const KM_H_PER_M_S = 3.6;
const MILES_H_PER_M_S = 2.236_936;
const INCHES_HG_PER_HPA = 0.029_529_98;

export function hPaToMmHg(hPa: number): number {
  return hPa * MM_HG_PER_HPA;
}

export function hPaToInHg(hPa: number): number {
  return hPa * INCHES_HG_PER_HPA;
}

export function celsiusToFahrenheit(celsius: number): number {
  return celsius * 1.8 + 32;
}

export function msToKmH(metresPerSecond: number): number {
  return metresPerSecond * KM_H_PER_M_S;
}

export function msToMph(metresPerSecond: number): number {
  return metresPerSecond * MILES_H_PER_M_S;
}

/** Ukrainian forecasts quote pressure in mmHg; imperial locales use inHg. */
export function pressureIn(system: UnitSystem, hPa: number): number {
  return system === 'metric' ? hPaToMmHg(hPa) : hPaToInHg(hPa);
}

export function temperatureIn(system: UnitSystem, celsius: number): number {
  return system === 'metric' ? celsius : celsiusToFahrenheit(celsius);
}

export function windSpeedIn(system: UnitSystem, metresPerSecond: number): number {
  return system === 'metric' ? metresPerSecond : msToMph(metresPerSecond);
}

const COMPASS_POINTS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/** Meteorological bearing (the direction wind comes *from*) to a compass point. */
export function compassPoint(degrees: number): CompassPoint {
  const normalised = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalised / 45) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index]!;
}
