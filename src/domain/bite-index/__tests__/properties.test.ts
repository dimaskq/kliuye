import * as fc from 'fast-check';

import { makeMoon, makeSun } from '@tests/factories/bite';

import { computeBiteScore, computeHourlyCurve, FACTOR_IDS, SPECIES_IDS } from '../index';
import type { BiteInputs } from '../types';

const arbitraryInputs = fc.record({
  species: fc.constantFrom(...SPECIES_IDS),
  hour: fc.integer({ min: 0, max: 23 }),
  month: fc.integer({ min: 1, max: 12 }),
  weather: fc.record({
    airTemperatureC: fc.double({ min: -30, max: 45, noNaN: true }),
    nightAirTemperatureC: fc.double({ min: -35, max: 30, noNaN: true }),
    windSpeedMs: fc.double({ min: 0, max: 30, noNaN: true }),
    windDirectionDeg: fc.double({ min: 0, max: 360, noNaN: true }),
    pressureHpa: fc.double({ min: 950, max: 1060, noNaN: true }),
    pressure24hAgoHpa: fc.double({ min: 950, max: 1060, noNaN: true }),
    cloudCoverPercent: fc.double({ min: 0, max: 100, noNaN: true }),
    precipitationProbabilityPercent: fc.double({ min: 0, max: 100, noNaN: true }),
    precipitationMm: fc.double({ min: 0, max: 60, noNaN: true }),
    waterTemperature: fc.option(
      fc.record({ celsius: fc.double({ min: -2, max: 35, noNaN: true }), estimated: fc.boolean() }),
      { nil: undefined },
    ),
    waterTrendC: fc.option(fc.double({ min: -5, max: 5, noNaN: true }), { nil: undefined }),
  }),
  sun: fc.constant(makeSun()),
  moon: fc.constant(makeMoon()),
}) satisfies fc.Arbitrary<BiteInputs>;

describe('bite score invariants', () => {
  it('always lands in [0, 100] with all eight factors', () => {
    fc.assert(
      fc.property(arbitraryInputs, (inputs) => {
        const score = computeBiteScore(inputs);
        expect(Number.isInteger(score.value)).toBe(true);
        expect(score.value).toBeGreaterThanOrEqual(0);
        expect(score.value).toBeLessThanOrEqual(100);
        expect(score.factors).toHaveLength(FACTOR_IDS.length);
        expect(score.confidence).toBeGreaterThan(0);
        expect(score.confidence).toBeLessThanOrEqual(1);
      }),
      { numRuns: 300 },
    );
  });

  it('keeps every factor score and confidence inside [0, 1]', () => {
    fc.assert(
      fc.property(arbitraryInputs, (inputs) => {
        computeBiteScore(inputs).factors.forEach((factor) => {
          expect(factor.score).toBeGreaterThanOrEqual(0);
          expect(factor.score).toBeLessThanOrEqual(1);
          expect(factor.confidence).toBeGreaterThan(0);
          expect(factor.confidence).toBeLessThanOrEqual(1);
        });
      }),
      { numRuns: 200 },
    );
  });

  it('keeps the hourly curve 24 long and bounded', () => {
    fc.assert(
      fc.property(arbitraryInputs, (inputs) => {
        const curve = computeHourlyCurve(inputs);
        expect(curve).toHaveLength(24);
        curve.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });
      }),
      { numRuns: 100 },
    );
  });
});
