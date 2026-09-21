import {
  celsiusToFahrenheit,
  compassPoint,
  hPaToInHg,
  hPaToMmHg,
  msToKmH,
  msToMph,
  pressureIn,
  temperatureIn,
  windSpeedIn,
} from '../index';

describe('units', () => {
  it('converts pressure', () => {
    expect(hPaToMmHg(1013.25)).toBeCloseTo(760, 0);
    expect(hPaToInHg(1013.25)).toBeCloseTo(29.92, 2);
  });

  it('converts temperature', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it('converts wind speed', () => {
    expect(msToKmH(10)).toBeCloseTo(36, 5);
    expect(msToMph(10)).toBeCloseTo(22.37, 2);
  });

  it('picks the unit for the active system', () => {
    expect(pressureIn('metric', 1000)).toBeCloseTo(750.06, 2);
    expect(pressureIn('imperial', 1000)).toBeCloseTo(29.53, 2);
    expect(temperatureIn('metric', 10)).toBe(10);
    expect(temperatureIn('imperial', 10)).toBe(50);
    expect(windSpeedIn('metric', 5)).toBe(5);
    expect(windSpeedIn('imperial', 5)).toBeCloseTo(11.18, 2);
  });

  it.each([
    [0, 'n'],
    [45, 'ne'],
    [90, 'e'],
    [135, 'se'],
    [180, 's'],
    [225, 'sw'],
    [270, 'w'],
    [315, 'nw'],
    [360, 'n'],
    [-45, 'nw'],
    [400, 'ne'],
  ] as const)('maps %p° to %p', (degrees, expected) => {
    expect(compassPoint(degrees)).toBe(expected);
  });
});
