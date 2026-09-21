import type { SpeciesId } from '@/domain/bite-index';
import { makeBiteInputs, makeMoon, makeSun, makeWeather } from '@tests/factories/bite';

import {
  airWaterDeltaFactor,
  cloudCoverFactor,
  moonFactor,
  precipitationFactor,
  pressureFactor,
  timeOfDayFactor,
  waterTemperatureFactor,
  windFactor,
} from '../factors';

const withWeather = (overrides: Parameters<typeof makeWeather>[0], species: SpeciesId = 'all') =>
  makeBiteInputs({ species, weather: makeWeather(overrides) });

describe('pressure', () => {
  it('scores a sharp 24 h rise at or below 0.15 for every species', () => {
    const inputs = withWeather({ pressureHpa: 1020, pressure24hAgoHpa: 1008 });
    (['all', 'pike', 'carp'] as const).forEach((species) => {
      expect(pressureFactor({ ...inputs, species }).score).toBeLessThanOrEqual(0.15);
    });
  });

  it('rewards a slow fall above a steady barometer', () => {
    const falling = pressureFactor(withWeather({ pressureHpa: 1005, pressure24hAgoHpa: 1008 }));
    const steady = pressureFactor(withWeather({ pressureHpa: 1008, pressure24hAgoHpa: 1008 }));
    expect(falling.score).toBeGreaterThan(steady.score);
    expect(falling.explanationKey).toBe('factor.pressure.falling');
    expect(steady.explanationKey).toBe('factor.pressure.steady');
  });

  it('labels a rise as rising', () => {
    expect(
      pressureFactor(withWeather({ pressureHpa: 1012, pressure24hAgoHpa: 1008 })).explanationKey,
    ).toBe('factor.pressure.rising');
  });
});

describe('wind', () => {
  it('peaks in the 3–5 m/s band, below both dead calm and a blow', () => {
    const at = (windSpeedMs: number) => windFactor(withWeather({ windSpeedMs })).score;
    expect(at(4)).toBeGreaterThan(at(0));
    expect(at(4)).toBeGreaterThan(at(8));
    expect(at(3)).toBeGreaterThan(at(0));
    expect(at(5)).toBeGreaterThan(at(8));
  });

  it('names calm, ripple and strong winds', () => {
    expect(windFactor(withWeather({ windSpeedMs: 0.5 })).explanationKey).toBe('factor.wind.calm');
    expect(windFactor(withWeather({ windSpeedMs: 4 })).explanationKey).toBe('factor.wind.ripple');
    expect(windFactor(withWeather({ windSpeedMs: 9 })).explanationKey).toBe('factor.wind.strong');
  });

  it('rewards onshore wind and penalises offshore wind when the bank is known', () => {
    const base = makeBiteInputs({
      weather: makeWeather({ windSpeedMs: 6, windDirectionDeg: 225 }),
    });
    const onshore = windFactor({ ...base, shoreBearingDeg: 240 }).score;
    const offshore = windFactor({ ...base, shoreBearingDeg: 45 }).score;
    const unknown = windFactor(base).score;
    expect(onshore).toBeGreaterThan(unknown);
    expect(offshore).toBeLessThan(unknown);
  });
});

describe('water temperature', () => {
  it('kills the carp score at +2 °C while pike stay moderate', () => {
    const cold = makeWeather({ waterTemperature: { celsius: 2, estimated: false } });
    expect(
      waterTemperatureFactor(makeBiteInputs({ species: 'carp', weather: cold })).score,
    ).toBeCloseTo(0, 5);
    const pike = waterTemperatureFactor(makeBiteInputs({ species: 'pike', weather: cold })).score;
    expect(pike).toBeGreaterThan(0.2);
    expect(pike).toBeLessThan(0.8);
  });

  it('scores anything inside the optimal band at 1', () => {
    expect(
      waterTemperatureFactor(
        withWeather({ waterTemperature: { celsius: 12, estimated: false } }, 'pike'),
      ).score,
    ).toBe(1);
  });

  it('falls back to neutral with reduced confidence when unknown', () => {
    const factor = waterTemperatureFactor(withWeather({ waterTemperature: undefined }));
    expect(factor.score).toBe(0.5);
    expect(factor.confidence).toBeLessThan(1);
    expect(factor.explanationKey).toBe('factor.water.unknown');
  });

  it('reports warming, cooling and steady water', () => {
    expect(waterTemperatureFactor(withWeather({ waterTrendC: 1.5 })).explanationKey).toBe(
      'factor.water.warming',
    );
    expect(waterTemperatureFactor(withWeather({ waterTrendC: -1.5 })).explanationKey).toBe(
      'factor.water.cooling',
    );
    expect(waterTemperatureFactor(withWeather({ waterTrendC: 0 })).explanationKey).toBe(
      'factor.water.steady',
    );
    expect(waterTemperatureFactor(withWeather({ waterTrendC: undefined })).explanationKey).toBe(
      'factor.water.steady',
    );
  });

  it('trusts an estimate less than a measurement', () => {
    const estimated = waterTemperatureFactor(
      withWeather({ waterTemperature: { celsius: 11, estimated: true } }),
    );
    expect(estimated.confidence).toBeLessThan(1);
  });
});

describe('moon', () => {
  const phases: readonly [number, string][] = [
    [0, 'factor.moon.new'],
    [0.1, 'factor.moon.waxingCrescent'],
    [0.25, 'factor.moon.firstQuarter'],
    [0.35, 'factor.moon.waxingGibbous'],
    [0.5, 'factor.moon.full'],
    [0.6, 'factor.moon.waningGibbous'],
    [0.75, 'factor.moon.lastQuarter'],
    [0.9, 'factor.moon.waningCrescent'],
    [1, 'factor.moon.new'],
  ];

  it.each(phases)('names phase %p', (phase, key) => {
    expect(moonFactor(makeBiteInputs({ moon: makeMoon({ phase }) })).explanationKey).toBe(key);
  });

  it('scores new and full moon above the quarters', () => {
    const at = (phase: number) => moonFactor(makeBiteInputs({ moon: makeMoon({ phase }) })).score;
    expect(at(0)).toBeGreaterThan(at(0.25));
    expect(at(0.5)).toBeGreaterThan(at(0.75));
  });

  it('clamps an out-of-range phase instead of throwing', () => {
    expect(
      moonFactor(makeBiteInputs({ moon: makeMoon({ phase: 1.4, ageDays: 41 }) })).score,
    ).toBeGreaterThan(0);
  });
});

describe('cloud cover', () => {
  it('prefers broken cloud to a clear sky', () => {
    const at = (cloudCoverPercent: number) =>
      cloudCoverFactor(withWeather({ cloudCoverPercent })).score;
    expect(at(70)).toBeGreaterThan(at(0));
    expect(at(70)).toBeGreaterThan(at(100));
  });

  it.each([
    [10, 'factor.cloud.clear'],
    [60, 'factor.cloud.broken'],
    [95, 'factor.cloud.overcast'],
  ])('names %p%% cover', (percent, key) => {
    expect(cloudCoverFactor(withWeather({ cloudCoverPercent: percent })).explanationKey).toBe(key);
  });
});

describe('precipitation', () => {
  it('ranks drizzle above both dry weather and a downpour', () => {
    const at = (precipitationMm: number) =>
      precipitationFactor(withWeather({ precipitationMm, precipitationProbabilityPercent: 0 }))
        .score;
    expect(at(0.6)).toBeGreaterThan(at(0));
    expect(at(0.6)).toBeGreaterThan(at(9));
  });

  it.each([
    [0, 'factor.precipitation.dry'],
    [0.6, 'factor.precipitation.drizzle'],
    [6, 'factor.precipitation.heavy'],
  ])('names %p mm', (millimetres, key) => {
    expect(precipitationFactor(withWeather({ precipitationMm: millimetres })).explanationKey).toBe(
      key,
    );
  });
});

describe('air/water delta', () => {
  it('prefers air a little warmer than the water', () => {
    const at = (airTemperatureC: number) =>
      airWaterDeltaFactor(withWeather({ airTemperatureC })).score;
    expect(at(13.5)).toBeGreaterThan(at(2));
    expect(at(13.5)).toBeGreaterThan(at(25));
  });

  it.each([
    [14, 'factor.airWater.warmer'],
    [11, 'factor.airWater.even'],
    [8, 'factor.airWater.colder'],
  ])('names %p °C air over 11 °C water', (airTemperatureC, key) => {
    expect(airWaterDeltaFactor(withWeather({ airTemperatureC })).explanationKey).toBe(key);
  });

  it('is neutral and less certain without a water reading', () => {
    const factor = airWaterDeltaFactor(withWeather({ waterTemperature: undefined }));
    expect(factor.score).toBe(0.5);
    expect(factor.confidence).toBe(0.5);
    expect(factor.explanationKey).toBe('factor.airWater.unknown');
  });

  it('trusts an estimated water reading less', () => {
    expect(
      airWaterDeltaFactor(withWeather({ waterTemperature: { celsius: 11, estimated: true } }))
        .confidence,
    ).toBe(0.8);
  });
});

describe('time of day', () => {
  const sun = makeSun({ sunriseHour: 6, sunsetHour: 20 });
  const at = (hour: number) => timeOfDayFactor(makeBiteInputs({ hour, sun }));

  it('peaks after sunrise and before sunset', () => {
    expect(at(7).score).toBeGreaterThan(at(13).score);
    expect(at(19).score).toBeGreaterThan(at(2).score);
  });

  it.each([
    [7, 'factor.time.dawn'],
    [19, 'factor.time.dusk'],
    [13, 'factor.time.day'],
    [2, 'factor.time.night'],
  ])('names hour %p', (hour, key) => {
    expect(at(hour).explanationKey).toBe(key);
  });
});
