import type { MoonState } from '../bite-index/types';

/**
 * Moon phase from Meeus, *Astronomical Algorithms*, ch. 49: mean new moon at
 * JDE 2451550.09766 repeating every synodic month. Pure and offline — the phase
 * never needs the network.
 */
const MEAN_NEW_MOON_JD = 2451550.09766;
export const SYNODIC_MONTH_DAYS = 29.530588861;
const UNIX_EPOCH_JD = 2440587.5;
const MS_PER_DAY = 86_400_000;

export function julianDay(date: Date): number {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

function normalisePhase(value: number): number {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

/** 0 and 1 are new moon, 0.5 is full moon. */
export function moonPhase(date: Date): number {
  return normalisePhase((julianDay(date) - MEAN_NEW_MOON_JD) / SYNODIC_MONTH_DAYS);
}

/** Whole days since the last new moon, 0–29. */
export function moonAgeDays(date: Date): number {
  return moonPhase(date) * SYNODIC_MONTH_DAYS;
}

/** Lit fraction of the disc, 0 at new moon and 1 at full moon. */
export function moonIllumination(date: Date): number {
  return (1 - Math.cos(2 * Math.PI * moonPhase(date))) / 2;
}

export function moonStateAt(date: Date): MoonState {
  return { phase: moonPhase(date), ageDays: Math.floor(moonAgeDays(date)) };
}
