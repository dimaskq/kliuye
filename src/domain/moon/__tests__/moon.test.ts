import {
  SYNODIC_MONTH_DAYS,
  julianDay,
  moonAgeDays,
  moonIllumination,
  moonPhase,
  moonStateAt,
} from '../index';

/** 2024-01-11 11:57 UTC was a new moon; 2024-01-25 17:54 UTC was full. */
const NEW_MOON = new Date('2024-01-11T11:57:00Z');
const FULL_MOON = new Date('2024-01-25T17:54:00Z');

describe('moon', () => {
  it('converts the Unix epoch to its Julian day', () => {
    expect(julianDay(new Date('1970-01-01T00:00:00Z'))).toBeCloseTo(2440587.5, 6);
  });

  it('reads close to 0 at a new moon and close to 0.5 at a full moon', () => {
    const newPhase = moonPhase(NEW_MOON);
    expect(Math.min(newPhase, 1 - newPhase)).toBeLessThan(0.02);
    expect(moonPhase(FULL_MOON)).toBeCloseTo(0.5, 1);
  });

  it('turns phase into illumination', () => {
    expect(moonIllumination(NEW_MOON)).toBeLessThan(0.02);
    expect(moonIllumination(FULL_MOON)).toBeGreaterThan(0.98);
  });

  it('ages the moon within one synodic month', () => {
    const age = moonAgeDays(FULL_MOON);
    expect(age).toBeGreaterThan(0);
    expect(age).toBeLessThan(SYNODIC_MONTH_DAYS);
  });

  it('normalises phases from before the epoch', () => {
    const phase = moonPhase(new Date('1900-05-04T00:00:00Z'));
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(1);
  });

  it('exposes a whole-day state for the scoring model', () => {
    const state = moonStateAt(FULL_MOON);
    expect(Number.isInteger(state.ageDays)).toBe(true);
    expect(state.phase).toBeCloseTo(0.5, 1);
  });
});
