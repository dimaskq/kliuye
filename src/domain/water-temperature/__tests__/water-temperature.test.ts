import { ESTIMATE_WINDOW_DAYS, estimateWaterTemperature, measuredWaterTemperature } from '../index';

describe('estimateWaterTemperature', () => {
  it('averages the last five days and applies the seasonal correction', () => {
    expect(estimateWaterTemperature([10, 10, 10, 10, 10], 4)).toEqual({
      celsius: 7.5,
      estimated: true,
    });
  });

  it('ignores days older than the window', () => {
    const long = [30, 30, 10, 10, 10, 10, 10];
    expect(long.length).toBeGreaterThan(ESTIMATE_WINDOW_DAYS);
    expect(estimateWaterTemperature(long, 4)?.celsius).toBe(7.5);
  });

  it('never returns a sub-zero water temperature', () => {
    expect(estimateWaterTemperature([-20, -20, -20], 1)?.celsius).toBe(0);
  });

  it('returns nothing without any readings', () => {
    expect(estimateWaterTemperature([], 6)).toBeUndefined();
  });

  it('falls back to no correction for an out-of-range month', () => {
    expect(estimateWaterTemperature([10, 10], 13)?.celsius).toBe(10);
  });
});

describe('measuredWaterTemperature', () => {
  it('marks a real reading as measured', () => {
    expect(measuredWaterTemperature(12.5)).toEqual({ celsius: 12.5, estimated: false });
  });

  it.each([null, undefined])('returns nothing for %p', (value) => {
    expect(measuredWaterTemperature(value)).toBeUndefined();
  });
});
