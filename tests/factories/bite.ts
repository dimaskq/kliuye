import type { BiteInputs, MoonState, SunTimes, WeatherSnapshot } from '@/domain/bite-index';

/**
 * Test data comes from factories with sane defaults and partial overrides —
 * never from copy-pasted fixtures.
 */
export function makeWeather(overrides: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    airTemperatureC: 14,
    nightAirTemperatureC: 6,
    windSpeedMs: 4,
    windDirectionDeg: 225,
    pressureHpa: 1005,
    pressure24hAgoHpa: 1008,
    cloudCoverPercent: 70,
    precipitationProbabilityPercent: 20,
    precipitationMm: 0.4,
    waterTemperature: { celsius: 11, estimated: false },
    waterTrendC: 1.5,
    ...overrides,
  };
}

export function makeSun(overrides: Partial<SunTimes> = {}): SunTimes {
  return { sunriseHour: 5.7, sunsetHour: 20, ...overrides };
}

export function makeMoon(overrides: Partial<MoonState> = {}): MoonState {
  return { phase: 0.02, ageDays: 1, ...overrides };
}

export function makeBiteInputs(overrides: Partial<BiteInputs> = {}): BiteInputs {
  const { weather, sun, moon, ...rest } = overrides;
  return {
    species: 'all',
    hour: 6,
    month: 4,
    weather: makeWeather(weather),
    sun: makeSun(sun),
    moon: makeMoon(moon),
    ...rest,
  };
}
