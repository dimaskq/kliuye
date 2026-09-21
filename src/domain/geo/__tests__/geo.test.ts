import { distanceKm } from '../index';

const KYIV = { latitude: 50.45, longitude: 30.523 };
const VYSHHOROD = { latitude: 50.583, longitude: 30.487 };

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm(KYIV, KYIV)).toBeCloseTo(0, 6);
  });

  it('matches a known short distance', () => {
    expect(distanceKm(KYIV, VYSHHOROD)).toBeCloseTo(15.1, 0);
  });

  it('is symmetric', () => {
    expect(distanceKm(KYIV, VYSHHOROD)).toBeCloseTo(distanceKm(VYSHHOROD, KYIV), 9);
  });
});
