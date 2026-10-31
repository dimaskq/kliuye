import {
  SEA_RANGES,
  SEA_REGIONS,
  SPECIES_IDS,
  computeBiteScore,
  livesIn,
  profileFor,
  ruledOutFor,
  seaRegionAt,
} from '@/domain/bite-index';
import { makeBiteInputs } from '@tests/factories/bite';

const PLACES = {
  varna: { latitude: 43.2, longitude: 27.95 },
  odesa: { latitude: 46.48, longitude: 30.75 },
  azov: { latitude: 46.75, longitude: 36.8 },
  istanbul: { latitude: 41.0, longitude: 29.0 },
  oslofjord: { latitude: 59.5, longitude: 10.6 },
  lofoten: { latitude: 68.2, longitude: 14.5 },
  helgeland: { latitude: 65.8, longitude: 12.5 },
  bergen: { latitude: 60.4, longitude: 5.3 },
  stockholm: { latitude: 59.3, longitude: 18.3 },
  gdansk: { latitude: 54.5, longitude: 18.7 },
  split: { latitude: 43.5, longitude: 16.4 },
  athens: { latitude: 37.9, longitude: 23.6 },
  tokyo: { latitude: 35.6, longitude: 139.8 },
  finnmark: { latitude: 70.6, longitude: 23.7 },
  kyiv: { latitude: 50.62, longitude: 30.48 },
} as const;

describe('seaRegionAt', () => {
  it.each([
    ['varna', 'blackSea'],
    ['odesa', 'blackSea'],
    ['azov', 'blackSea'],
    ['istanbul', 'blackSea'],
    ['oslofjord', 'northAtlantic'],
    ['lofoten', 'northAtlantic'],
    ['helgeland', 'northAtlantic'],
    ['bergen', 'northAtlantic'],
    ['finnmark', 'northAtlantic'],
    ['stockholm', 'baltic'],
    ['gdansk', 'baltic'],
    ['split', 'mediterranean'],
    ['athens', 'mediterranean'],
  ] as const)('puts %s in the %s', (place, region) => {
    expect(seaRegionAt(PLACES[place])).toBe(region);
  });

  it('knows nothing about seas it has no fish for', () => {
    expect(seaRegionAt(PLACES.tokyo)).toBeUndefined();
  });

  it('puts no sea under the middle of the continent', () => {
    expect(seaRegionAt(PLACES.kyiv)).toBeUndefined();
  });
});

describe('who lives where', () => {
  it('has no cod or saithe in the Black Sea', () => {
    expect(livesIn('cod', 'blackSea')).toBe(false);
    expect(livesIn('saithe', 'blackSea')).toBe(false);
    expect(livesIn('halibut', 'blackSea')).toBe(false);
  });

  it('has no horse mackerel, bluefish or mullet off Norway', () => {
    expect(livesIn('horseMackerel', 'northAtlantic')).toBe(false);
    expect(livesIn('bluefish', 'northAtlantic')).toBe(false);
    expect(livesIn('mullet', 'northAtlantic')).toBe(false);
  });

  it('keeps the fish that really are in both', () => {
    expect(livesIn('flounder', 'blackSea')).toBe(true);
    expect(livesIn('flounder', 'northAtlantic')).toBe(true);
    expect(livesIn('turbot', 'blackSea')).toBe(true);
    expect(livesIn('turbot', 'northAtlantic')).toBe(true);
  });

  it('rules nothing out where the sea is unknown', () => {
    expect(livesIn('cod', undefined)).toBe(true);
  });

  it('gives every sea fish a range, and only known seas in it', () => {
    const seaFish = SPECIES_IDS.filter((id) => profileFor(id).habitat === 'sea');
    expect(Object.keys(SEA_RANGES).sort()).toEqual([...seaFish].sort());
    for (const range of Object.values(SEA_RANGES)) {
      for (const region of range) expect(SEA_REGIONS).toContain(region);
    }
  });

  it('never limits a freshwater fish', () => {
    expect(livesIn('carp', 'northAtlantic')).toBe(true);
    expect(livesIn('pike', 'blackSea')).toBe(true);
  });
});

describe('the index outside the fish range', () => {
  it('scores cod at 0 off Varna and says why', () => {
    const score = computeBiteScore(
      makeBiteInputs({ species: 'cod', month: 3, seaNearby: true, seaRegion: 'blackSea' }),
    );
    expect(score.value).toBe(0);
    expect(score.ruledOut).toBe('notInThisSea');
  });

  it('still scores horse mackerel off Varna in season', () => {
    expect(
      ruledOutFor({ species: 'horseMackerel', month: 8, seaNearby: true, seaRegion: 'blackSea' }),
    ).toBeUndefined();
  });

  it('says "no sea" before "not this sea" far inland', () => {
    expect(ruledOutFor({ species: 'cod', month: 3, seaNearby: false, seaRegion: 'blackSea' })).toBe(
      'noSea',
    );
  });
});
