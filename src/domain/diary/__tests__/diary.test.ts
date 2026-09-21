import {
  byNewest,
  canShift,
  catchStats,
  dayOf,
  formatWeight,
  makeCatchId,
  parseWeight,
  shiftDays,
  MAX_WEIGHT_KG,
} from '..';
import type { Catch } from '..';

const MAY_2 = new Date(2026, 4, 2, 7, 30).getTime();
const MAY_2_EVENING = new Date(2026, 4, 2, 19, 10).getTime();
const MAY_9 = new Date(2026, 4, 9, 6, 0).getTime();

function entry(over: Partial<Catch>): Catch {
  return {
    id: 'c1',
    caughtAt: MAY_2,
    speciesId: 'pike',
    weightKg: 1,
    place: 'Затока',
    note: '',
    media: [],
    ...over,
  };
}

describe('catchStats', () => {
  it('reports nothing rather than zeros for an empty diary', () => {
    expect(catchStats([])).toEqual({ trips: 0, fish: 0, recordKg: 0, sinceYear: undefined });
  });

  it('counts two fish from one morning as a single trip', () => {
    const stats = catchStats([
      entry({ id: 'a', caughtAt: MAY_2, weightKg: 1.2 }),
      entry({ id: 'b', caughtAt: MAY_2_EVENING, weightKg: 3.4 }),
      entry({ id: 'c', caughtAt: MAY_9, weightKg: 2 }),
    ]);
    expect(stats).toEqual({ trips: 2, fish: 3, recordKg: 3.4, sinceYear: 2026 });
  });

  it('takes the year from the earliest catch, not the newest', () => {
    const older = entry({ id: 'old', caughtAt: new Date(2024, 7, 1).getTime() });
    expect(catchStats([entry({}), older]).sinceYear).toBe(2024);
  });
});

describe('dates', () => {
  it('puts a whole local day under one number', () => {
    expect(dayOf(MAY_2)).toBe(dayOf(MAY_2_EVENING));
    expect(dayOf(MAY_9) - dayOf(MAY_2)).toBe(7);
  });

  it('steps by days and keeps the time of day', () => {
    const back = shiftDays(MAY_2, -1);
    expect(new Date(back).getHours()).toBe(new Date(MAY_2).getHours());
    expect(dayOf(MAY_2) - dayOf(back)).toBe(1);
  });

  it('refuses to move the date into the future', () => {
    expect(canShift(MAY_2, 1, MAY_9)).toBe(true);
    expect(canShift(MAY_9, 1, MAY_9)).toBe(false);
    expect(canShift(MAY_9, -1, MAY_9)).toBe(true);
  });
});

describe('weight', () => {
  it.each([
    ['2,4', 2.4],
    ['2.4', 2.4],
    ['', 0],
    ['кг', 0],
    ['-3', 0],
    ['0', 0],
    ['2.456', 2.46],
    ['9000', MAX_WEIGHT_KG],
  ])('reads %p as %p kg', (input, expected) => {
    expect(parseWeight(input)).toBe(expected);
  });

  it('round-trips back into the field', () => {
    expect(formatWeight(parseWeight('2,4'))).toBe('2.4');
    expect(formatWeight(0)).toBe('');
  });
});

describe('list', () => {
  it('shows the newest catch first', () => {
    const sorted = byNewest([entry({ id: 'old' }), entry({ id: 'new', caughtAt: MAY_9 })]);
    expect(sorted.map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('gives every entry its own id', () => {
    const ids = new Set([
      makeCatchId(MAY_2, 0.1),
      makeCatchId(MAY_2, 0.9),
      makeCatchId(MAY_9, 0.1),
    ]);
    expect(ids.size).toBe(3);
  });
});
