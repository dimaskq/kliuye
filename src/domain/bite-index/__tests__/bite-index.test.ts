import { makeBiteInputs, makeMoon, makeSun, makeWeather } from '@tests/factories/bite';

import {
  BEST_WINDOW_HOURS,
  HOURS_PER_DAY,
  computeBiteScore,
  computeHourlyCurve,
  computeScoreValue,
  computeWeeklyForecast,
  findBestWindow,
  FACTOR_IDS,
  FACTOR_WEIGHTS,
  NONE,
  PEAK,
  SPECIES_IDS,
  activityIn,
  profileFor,
  ruledOutFor,
  speciesOf,
  totalWeight,
} from '../index';
import { WEIGHT_SUM_TOLERANCE } from '../weights';

const idealPike = makeBiteInputs({
  species: 'pike',
  hour: 7,
  month: 4,
  weather: makeWeather({
    airTemperatureC: 14,
    windSpeedMs: 4,
    pressureHpa: 1005,
    pressure24hAgoHpa: 1008,
    cloudCoverPercent: 70,
    precipitationMm: 0.5,
    precipitationProbabilityPercent: 40,
    waterTemperature: { celsius: 12, estimated: false },
  }),
  sun: makeSun({ sunriseHour: 6, sunsetHour: 20 }),
  moon: makeMoon({ phase: 0, ageDays: 0 }),
});

describe('weights', () => {
  it('sum to exactly one', () => {
    expect(Math.abs(totalWeight() - 1)).toBeLessThan(WEIGHT_SUM_TOLERANCE);
  });

  it('cover every factor id', () => {
    expect(Object.keys(FACTOR_WEIGHTS).sort()).toEqual([...FACTOR_IDS].sort());
  });
});

describe('computeBiteScore', () => {
  it('rates ideal pike conditions as a feeding frenzy', () => {
    const score = computeBiteScore(idealPike);
    expect(score.value).toBeGreaterThanOrEqual(82);
    expect(score.verdict).toBe('feeding');
  });

  it('always returns all eight factors in a stable order', () => {
    expect(computeBiteScore(makeBiteInputs()).factors.map((factor) => factor.id)).toEqual([
      ...FACTOR_IDS,
    ]);
  });

  it('is idempotent for identical inputs', () => {
    const inputs = makeBiteInputs({ species: 'zander', hour: 19 });
    expect(computeBiteScore(inputs)).toEqual(computeBiteScore(inputs));
  });

  it('still scores, with lowered confidence, when water temperature is missing', () => {
    const score = computeBiteScore(
      makeBiteInputs({
        weather: makeWeather({ waterTemperature: undefined, waterTrendC: undefined }),
      }),
    );
    expect(score.value).toBeGreaterThanOrEqual(0);
    expect(score.confidence).toBeLessThan(1);
  });

  it('reports full confidence when every reading is measured', () => {
    expect(computeBiteScore(idealPike).confidence).toBe(1);
  });

  it('lowers confidence for an estimated water temperature', () => {
    const estimated = computeBiteScore(
      makeBiteInputs({
        weather: makeWeather({ waterTemperature: { celsius: 11, estimated: true } }),
      }),
    );
    expect(estimated.confidence).toBeGreaterThan(0.9);
    expect(estimated.confidence).toBeLessThan(1);
  });

  it('scores a poor month lower than a peak one', () => {
    const summer = computeBiteScore(makeBiteInputs({ species: 'pike', month: 7 }));
    const autumn = computeBiteScore(makeBiteInputs({ species: 'pike', month: 9 }));
    expect(summer.value).toBeLessThan(autumn.value);
  });
});

describe('bite seasons', () => {
  it.each([
    ['catfish', 1],
    ['crucian', 12],
    ['carp', 2],
    ['bluefish', 3],
    ['horseMackerel', 1],
    ['mackerel', 11],
    ['salmon', 2],
    ['halibut', 2],
  ] as const)('rules %s out in month %i, with the reason', (species, month) => {
    const score = computeBiteScore(makeBiteInputs({ species, month }));
    expect(score.value).toBe(0);
    expect(score.ruledOut).toBe('noSeason');
  });

  it('puts the missing sea before the season as the reason', () => {
    expect(ruledOutFor({ species: 'bluefish', month: 3, seaNearby: false })).toBe('noSea');
  });

  it('follows the fish into its season', () => {
    const score = computeBiteScore(makeBiteInputs({ species: 'catfish', month: 7 }));
    expect(score.value).toBeGreaterThan(0);
    expect(score.ruledOut).toBeUndefined();
  });

  it('gives every species twelve levels between 0 and 1, and a best month', () => {
    SPECIES_IDS.forEach((species) => {
      const { activity } = profileFor(species);
      expect(activity).toHaveLength(12);
      activity.forEach((level) => {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      });
      expect(Math.max(...activity)).toBe(PEAK);
    });
  });

  it('treats a month outside 1–12 as no season rather than crashing', () => {
    expect(activityIn(profileFor('pike').activity, 13)).toBe(NONE);
  });
});

describe('sea fish far from the sea', () => {
  const inland = { month: 7, seaNearby: false } as const;

  it.each(speciesOf('sea'))('rules %s out with an index of 0', (species) => {
    const score = computeBiteScore(makeBiteInputs({ ...inland, species }));
    expect(score.value).toBe(0);
    expect(score.verdict).toBe('dead');
    expect(score.ruledOut).toBe('noSea');
    expect(computeHourlyCurve(makeBiteInputs({ ...inland, species })).every((v) => v === 0)).toBe(
      true,
    );
  });

  it('zeroes every day of the week, not only today', () => {
    const { species: _ignored, ...day } = makeBiteInputs({ ...inland });
    const week = computeWeeklyForecast({ species: 'cod', days: [day, day, day] });
    expect(week.map((entry) => entry.value)).toEqual([0, 0, 0]);
  });

  it('still scores sea fish at the coast', () => {
    const coast = computeBiteScore(
      makeBiteInputs({ species: 'mackerel', month: 7, seaNearby: true }),
    );
    expect(coast.value).toBeGreaterThan(0);
    expect(coast.ruledOut).toBeUndefined();
  });

  it('rules nothing out while the coast is not known yet', () => {
    const unknown = makeBiteInputs({ species: 'mackerel', month: 7 });
    expect(computeScoreValue(unknown)).toBe(computeScoreValue({ ...unknown, seaNearby: true }));
  });

  it('leaves freshwater fish and the mixed baseline alone', () => {
    for (const species of ['pike', 'all'] as const) {
      const far = computeScoreValue(makeBiteInputs({ ...inland, species }));
      const near = computeScoreValue(makeBiteInputs({ month: 7, species, seaNearby: true }));
      expect(far).toBe(near);
      expect(far).toBeGreaterThan(0);
    }
  });
});

describe('computeHourlyCurve', () => {
  it('returns 24 values inside [0, 100]', () => {
    const curve = computeHourlyCurve(makeBiteInputs());
    expect(curve).toHaveLength(HOURS_PER_DAY);
    curve.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it('peaks around dawn and dusk rather than at midnight', () => {
    const curve = computeHourlyCurve(
      makeBiteInputs({ sun: makeSun({ sunriseHour: 6, sunsetHour: 20 }) }),
    );
    expect(curve[7]!).toBeGreaterThan(curve[2]!);
    expect(curve[19]!).toBeGreaterThan(curve[2]!);
  });
});

describe('findBestWindow', () => {
  it('points at the real maximum of three consecutive hours', () => {
    const inputs = makeBiteInputs({ sun: makeSun({ sunriseHour: 6, sunsetHour: 20 }) });
    const curve = computeHourlyCurve(inputs);
    const { startHour, endHour } = findBestWindow(curve);
    const sumAt = (start: number): number =>
      curve.slice(start, start + BEST_WINDOW_HOURS).reduce((total, value) => total + value, 0);
    const best = sumAt(startHour);

    expect(endHour).toBe(startHour + BEST_WINDOW_HOURS);
    for (let start = 0; start <= curve.length - BEST_WINDOW_HOURS; start += 1) {
      expect(sumAt(start)).toBeLessThanOrEqual(best);
    }
  });

  it('keeps the earliest window when several tie', () => {
    expect(findBestWindow([5, 5, 5, 5, 5, 5])).toEqual({ startHour: 0, endHour: 3 });
  });
});

describe('per-hour weather', () => {
  it("uses the hour's own snapshot when the day has one", () => {
    const calm = makeWeather({ windSpeedMs: 4 });
    const gale = makeWeather({ windSpeedMs: 25 });
    const hourlyWeather = Array.from({ length: 24 }, (_, hour) => (hour === 12 ? gale : calm));
    const curve = computeHourlyCurve(makeBiteInputs({ weather: calm, hourlyWeather }));
    expect(curve[12]!).toBeLessThan(curve[11]!);
  });

  it('falls back to the day snapshot for hours it does not cover', () => {
    const inputs = makeBiteInputs({ hourlyWeather: [] });
    expect(computeHourlyCurve(inputs)).toEqual(computeHourlyCurve(makeBiteInputs()));
  });
});

describe('computeWeeklyForecast', () => {
  it('returns one entry per day, tagged with its offset', () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      makeBiteInputs({ hour: 6, weather: makeWeather({ windSpeedMs: index }) }),
    );
    const week = computeWeeklyForecast({ species: 'perch', days });

    expect(week).toHaveLength(7);
    expect(week.map((day) => day.dayOffset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    week.forEach((day) => expect(day.factors).toHaveLength(FACTOR_IDS.length));
  });
});

describe('computeScoreValue', () => {
  it('is the same number as the full score, without building the curve', () => {
    for (const hour of [0, 7, 13, 21]) {
      const inputs = { ...idealPike, hour };
      expect(computeScoreValue(inputs)).toBe(computeBiteScore(inputs).value);
    }
  });

  it('lets a caller reuse a curve it already has', () => {
    const curve = computeHourlyCurve(idealPike);
    expect(computeBiteScore(idealPike, curve)).toEqual(computeBiteScore(idealPike));
  });
});
