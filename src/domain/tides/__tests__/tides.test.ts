import { MEANINGFUL_TIDE_M, isMeaningfulTide, tideDay } from '@/domain/tides';

/** 26 hourly readings — 23:00 the day before to 00:00 the day after. */
function series(rangeM: number, periodH = 12.42, phaseH = 3): number[] {
  return Array.from(
    { length: 26 },
    (_, i) => (rangeM / 2) * Math.cos((2 * Math.PI * (i - 1 - phaseH)) / periodH),
  );
}

describe('tideDay', () => {
  it('finds two highs and two lows in a semidiurnal day, in order', () => {
    const tide = tideDay(series(1.6))!;
    expect(tide.turns.map((turn) => turn.kind)).toEqual(['high', 'low', 'high', 'low']);
    expect(tide.rangeM).toBeCloseTo(1.6, 1);
  });

  it('times high water to the minute, not just to the hour', () => {
    const [first] = tideDay(series(1.6, 12.42, 3.4))!.turns;
    expect(first?.kind).toBe('high');
    expect(first?.hour).toBeCloseTo(3.4, 1);
    expect(first?.heightM).toBeCloseTo(0.8, 1);
  });

  it('calls a Black Sea day no tide at all', () => {
    expect(isMeaningfulTide(tideDay(series(0.07)))).toBe(false);
  });

  it('calls a Norwegian day a tide worth showing', () => {
    expect(isMeaningfulTide(tideDay(series(1.4)))).toBe(true);
    expect(MEANINGFUL_TIDE_M).toBeLessThan(1.4);
  });

  it('gives no tide rather than a wrong one when a reading is missing', () => {
    const gappy: (number | null)[] = series(1.6);
    gappy[10] = null;
    expect(tideDay(gappy)).toBeUndefined();
    expect(tideDay(series(1.6).slice(0, 20))).toBeUndefined();
  });
});
