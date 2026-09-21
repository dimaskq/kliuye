import {
  clamp01,
  bearingDistance,
  hourDistance,
  peakCurve,
  plateauCurve,
  towardNeutral,
} from '../curves';
import { verdictFor, verdictNoteKey, verdictWordKey } from '../verdicts';

describe('verdictFor', () => {
  it.each([
    [100, 'feeding'],
    [82, 'feeding'],
    [81, 'good'],
    [66, 'good'],
    [65, 'moderate'],
    [46, 'moderate'],
    [45, 'weak'],
    [26, 'weak'],
    [25, 'dead'],
    [0, 'dead'],
  ] as const)('maps %p to %p', (value, expected) => {
    expect(verdictFor(value)).toBe(expected);
  });

  it('builds i18n keys rather than sentences', () => {
    expect(verdictWordKey('feeding')).toBe('verdict.feeding.word');
    expect(verdictNoteKey('dead')).toBe('verdict.dead.note');
  });
});

describe('curves', () => {
  it('clamps to [0, 1] and treats NaN as zero', () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('peaks at the centre and reaches zero at the span', () => {
    expect(peakCurve(5, 5, 3)).toBe(1);
    expect(peakCurve(8, 5, 3)).toBe(0);
    expect(peakCurve(20, 5, 3)).toBe(0);
    expect(peakCurve(6, 5, 3)).toBeGreaterThan(0);
  });

  it('holds a plateau inside the band and decays beyond it', () => {
    expect(plateauCurve(15, 10, 20, 5)).toBe(1);
    expect(plateauCurve(4, 10, 20, 5)).toBe(0);
    expect(plateauCurve(26, 10, 20, 5)).toBe(0);
    expect(plateauCurve(8, 10, 20, 5)).toBeGreaterThan(0);
    expect(plateauCurve(22, 10, 20, 5)).toBeGreaterThan(0);
  });

  it('pulls toward neutral by the inverse of the strength', () => {
    expect(towardNeutral(1, 0)).toBe(0.5);
    expect(towardNeutral(1, 1)).toBe(1);
    expect(towardNeutral(0, 1)).toBe(0);
  });

  it('measures hour and bearing distance the short way round', () => {
    expect(hourDistance(23, 1)).toBe(2);
    expect(hourDistance(6, 7)).toBe(1);
    expect(bearingDistance(350, 10)).toBe(20);
    expect(bearingDistance(90, 100)).toBe(10);
  });
});
