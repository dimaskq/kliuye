import { SPECIES_IDS } from '@/domain/bite-index';
import { DEFAULT_SPOT } from '@/domain/spots';
import { toForecast } from '@/services/weather/mapper';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';

import { buildBiteModel, scoreValueAt } from '../useBiteModel';

const forecast = toForecast(makeForecastResponse(), makeMarineResponse(), Date.UTC(2026, 8, 21, 6));

describe('buildBiteModel', () => {
  it('reuses the curve and the week while only the hour changes', () => {
    const morning = buildBiteModel(forecast, DEFAULT_SPOT, 'pike', 6)!;
    const evening = buildBiteModel(forecast, DEFAULT_SPOT, 'pike', 19)!;

    expect(evening.week).toBe(morning.week);
    expect(evening.curve).toBe(morning.curve);
    expect(evening.score).not.toEqual(morning.score);
  });

  it('keeps each species apart', () => {
    const pike = buildBiteModel(forecast, DEFAULT_SPOT, 'pike', 6)!;
    const carp = buildBiteModel(forecast, DEFAULT_SPOT, 'carp', 6)!;
    expect(carp.week).not.toBe(pike.week);
  });

  it('scores the hour it is asked about, over the shared curve', () => {
    const model = buildBiteModel(forecast, DEFAULT_SPOT, 'pike', 9)!;
    expect(model.score.value).toBe(model.curve[9]);
    expect(model.tips.length).toBeGreaterThan(0);
  });
});

describe('scoreValueAt', () => {
  it('matches the headline score for every species', () => {
    for (const species of SPECIES_IDS) {
      const model = buildBiteModel(forecast, DEFAULT_SPOT, species, 8)!;
      expect(scoreValueAt(forecast, DEFAULT_SPOT, species, 8)).toBe(model.score.value);
    }
  });
});
