import {
  FRESH_RANGES,
  FRESH_REGIONS,
  coldLowlandAt,
  computeBiteScore,
  freshRegionAt,
  livesAt,
  livesInFresh,
  livesLow,
  ruledOutFor,
} from '@/domain/bite-index';
import { makeBiteInputs } from '@tests/factories/bite';

const PLACES = {
  kyiv: { latitude: 50.45, longitude: 30.52 },
  seville: { latitude: 37.39, longitude: -5.98 },
  sicily: { latitude: 37.5, longitude: 14.0 },
  istanbul: { latitude: 41.0, longitude: 29.0 },
  novosibirsk: { latitude: 55.0, longitude: 82.9 },
  shanghai: { latitude: 31.2, longitude: 121.5 },
  ontario: { latitude: 44.0, longitude: -79.0 },
  algiers: { latitude: 36.75, longitude: 3.06 },
  lakeVictoria: { latitude: -1.0, longitude: 33.0 },
  sydney: { latitude: -33.9, longitude: 151.2 },
} as const;

describe('freshRegionAt', () => {
  it.each([
    ['kyiv', 'europe'],
    ['seville', 'europe'],
    ['sicily', 'europe'],
    ['istanbul', 'europe'],
    ['novosibirsk', 'northAsia'],
    ['shanghai', 'eastAsia'],
    ['ontario', 'northAmerica'],
  ] as const)('puts %s in %s', (place, region) => {
    expect(freshRegionAt(PLACES[place])).toBe(region);
  });

  it.each(['algiers', 'lakeVictoria', 'sydney'] as const)('puts %s elsewhere', (place) => {
    expect(freshRegionAt(PLACES[place])).toBeUndefined();
  });
});

describe('who lives where in fresh water', () => {
  it('has no wels catfish, zander or pike in Africa', () => {
    const africa = freshRegionAt(PLACES.lakeVictoria);
    expect(livesInFresh('catfish', africa, true)).toBe(false);
    expect(livesInFresh('zander', africa, true)).toBe(false);
    expect(livesInFresh('pike', africa, true)).toBe(false);
  });

  it('keeps carp and trout everywhere they have been stocked', () => {
    expect(livesInFresh('carp', undefined, true)).toBe(true);
    expect(livesInFresh('trout', undefined, true)).toBe(true);
  });

  it('has pike and perch in North America, but not zander', () => {
    expect(livesInFresh('pike', 'northAmerica', true)).toBe(true);
    expect(livesInFresh('perch', 'northAmerica', true)).toBe(true);
    expect(livesInFresh('zander', 'northAmerica', true)).toBe(false);
  });

  it('rules nothing out by place when the place is not known', () => {
    expect(livesInFresh('catfish', undefined, false)).toBe(true);
  });

  it('lists only known regions', () => {
    for (const range of Object.values(FRESH_RANGES)) {
      for (const region of range) expect(FRESH_REGIONS).toContain(region);
    }
  });
});

describe('height', () => {
  it('has no carp high in the mountains, but trout', () => {
    expect(livesAt('carp', 1800)).toBe(false);
    expect(livesAt('trout', 1800)).toBe(true);
  });

  it('keeps every lowland fish in the lowlands', () => {
    expect(livesAt('catfish', 120)).toBe(true);
    expect(livesAt('carp', undefined)).toBe(true);
  });
});

describe('the index outside the range', () => {
  const kyiv = { located: true, freshRegion: 'europe', elevationM: 103 } as const;

  it('scores a wels catfish at 0 on Lake Victoria and says why', () => {
    const score = computeBiteScore(
      makeBiteInputs({ species: 'catfish', month: 7, located: true, freshRegion: undefined }),
    );
    expect(score.value).toBe(0);
    expect(score.ruledOut).toBe('notInThisRegion');
  });

  it('scores carp at 0 on a Carpathian lake at 1,800 m, and trout above 0', () => {
    const high = { located: true, freshRegion: 'europe', elevationM: 1800, month: 6 } as const;
    expect(ruledOutFor({ species: 'carp', ...high })).toBe('tooHigh');
    expect(computeBiteScore(makeBiteInputs({ species: 'trout', ...high })).value).toBeGreaterThan(
      0,
    );
  });

  it('leaves every freshwater fish in Kyiv alone in summer', () => {
    for (const species of ['pike', 'zander', 'carp', 'catfish', 'trout'] as const) {
      expect(ruledOutFor({ species, month: 7, ...kyiv })).toBeUndefined();
    }
  });
});

describe('trout in the lowlands', () => {
  const donetsk = { latitude: 48.0, longitude: 37.8 };
  const florida = { latitude: 28.56, longitude: -81.59 };
  const devon = { latitude: 50.7, longitude: -3.5 };
  const pomerania = { latitude: 54.2, longitude: 16.9 };
  const montana = { latitude: 45.7, longitude: -111.0 };
  const poValley = { latitude: 45.1, longitude: 10.0 };

  it('knows the cold lowlands from the warm ones', () => {
    for (const point of [devon, pomerania, montana]) expect(coldLowlandAt(point)).toBe(true);
    for (const point of [donetsk, florida, poValley, PLACES.kyiv]) {
      expect(coldLowlandAt(point)).toBe(false);
    }
  });

  it('has no trout in the Donbas steppe, but in the Carpathians', () => {
    expect(livesLow('trout', 200, coldLowlandAt(donetsk))).toBe(false);
    expect(livesLow('trout', 700, false)).toBe(true);
  });

  it('keeps trout in the chalk streams of England', () => {
    expect(livesLow('trout', 40, coldLowlandAt(devon))).toBe(true);
  });

  it('rules nothing out with no height or no place, and no lowland fish ever', () => {
    expect(livesLow('trout', undefined, false)).toBe(true);
    expect(livesLow('trout', 50, undefined)).toBe(true);
    expect(livesLow('carp', 50, false)).toBe(true);
  });

  it('scores trout at 0 by Donetsk in May and says why', () => {
    const inputs = makeBiteInputs({
      species: 'trout',
      month: 5,
      located: true,
      freshRegion: freshRegionAt(donetsk),
      coldLowland: coldLowlandAt(donetsk),
      elevationM: 180,
    });
    const score = computeBiteScore(inputs);
    expect(score.value).toBe(0);
    expect(score.ruledOut).toBe('tooLow');
  });
});
