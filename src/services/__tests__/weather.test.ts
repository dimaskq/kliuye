import { HttpResponse, http } from 'msw';

import { COORDINATE_PRECISION } from '@/domain/geo';
import { makeForecastResponse, makeMarineResponse } from '@tests/factories/open-meteo';
import { server } from '@tests/msw/server';

import { PAST_DAYS, fetchForecast, hourOfDay, monthOf, toForecast } from '../weather';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const NOW = new Date('2025-04-12T05:41:00Z');
const KYIV_SEA = { latitude: 50.583_71, longitude: 30.492_19 };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => jest.useRealTimers());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function serveForecast(marine: object = makeMarineResponse()): void {
  server.use(
    http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
    http.get(MARINE_URL, () => HttpResponse.json(marine)),
  );
}

describe('hourOfDay', () => {
  it('reads a local ISO time as fractional hours', () => {
    expect(hourOfDay('2025-04-12T05:41')).toBeCloseTo(5.683, 3);
    expect(hourOfDay('2025-04-12')).toBe(0);
  });
});

describe('monthOf', () => {
  it('reads the month out of an ISO date', () => {
    expect(monthOf('2025-04-12')).toBe(4);
  });

  it('rejects a date the API should never send', () => {
    expect(() => monthOf('April 2025')).toThrow(/Unexpected date/);
  });
});

describe('fetchForecast', () => {
  it('returns seven days of 24 hourly snapshots', async () => {
    serveForecast();
    const forecast = await fetchForecast(KYIV_SEA, NOW);

    expect(forecast.days).toHaveLength(7);
    forecast.days.forEach((day) => expect(day.hourlyWeather).toHaveLength(24));
    expect(forecast.fetchedAt).toBe(NOW.getTime());
    expect(forecast.timezone).toBe('Europe/Kyiv');
  });

  it('rounds the coordinates before they leave the device', async () => {
    let requested = '';
    server.use(
      http.get(FORECAST_URL, ({ request }) => {
        requested = new URL(request.url).search;
        return HttpResponse.json(makeForecastResponse());
      }),
      http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
    );
    await fetchForecast(KYIV_SEA, NOW);

    expect(requested).toContain(`latitude=${KYIV_SEA.latitude.toFixed(COORDINATE_PRECISION)}`);
    expect(requested).not.toContain('50.58371');
  });

  it('uses the measured sea-surface temperature when the marine API answers', async () => {
    serveForecast();
    const forecast = await fetchForecast(KYIV_SEA, NOW);
    expect(forecast.days[0]?.hourlyWeather[0]?.waterTemperature).toEqual({
      celsius: expect.any(Number),
      estimated: false,
    });
  });

  it('falls back to an estimate when the marine API fails', async () => {
    server.use(
      http.get(FORECAST_URL, () => HttpResponse.json(makeForecastResponse())),
      http.get(MARINE_URL, () => new HttpResponse(null, { status: 404 })),
    );
    const forecast = await fetchForecast(KYIV_SEA, NOW);
    expect(forecast.days[0]?.hourlyWeather[0]?.waterTemperature?.estimated).toBe(true);
  });

  it('rejects a payload that does not match the schema', async () => {
    server.use(
      http.get(FORECAST_URL, () => HttpResponse.json({ nope: true })),
      http.get(MARINE_URL, () => HttpResponse.json(makeMarineResponse())),
    );
    await expect(fetchForecast(KYIV_SEA, NOW)).rejects.toMatchObject({ kind: 'validation' });
  });

  it('ignores a marine payload that does not match the schema', async () => {
    serveForecast({ hourly: { time: [], sea_surface_temperature: 'warm' } });
    const forecast = await fetchForecast(KYIV_SEA, NOW);
    expect(forecast.days[0]?.hourlyWeather[0]?.waterTemperature?.estimated).toBe(true);
  });
});

describe('toForecast', () => {
  it('carries the 24 h pressure trend into every snapshot', () => {
    const forecast = toForecast(makeForecastResponse(), undefined, NOW.getTime());
    const snapshot = forecast.days[0]?.hourlyWeather[0];
    expect(snapshot?.pressure24hAgoHpa).toBeGreaterThan(snapshot?.pressureHpa ?? 0);
  });

  it('reads sunrise and sunset from the daily block', () => {
    const forecast = toForecast(makeForecastResponse(), undefined, NOW.getTime());
    expect(forecast.days[0]?.sun.sunriseHour).toBeCloseTo(5.683, 3);
    expect(forecast.days[0]?.sun.sunsetHour).toBeCloseTo(19.967, 3);
  });

  it('rejects a response without the requested past-days window', () => {
    const short = makeForecastResponse({
      daily: { ...makeForecastResponse().daily, time: ['2025-04-12'] },
    });
    expect(() => toForecast(short, undefined, NOW.getTime())).toThrow(/past-days/);
  });

  it('rejects a response with a hole in a required series', () => {
    const base = makeForecastResponse();
    const holed = makeForecastResponse({
      hourly: { ...base.hourly, temperature_2m: base.hourly.temperature_2m.map(() => null) },
    });
    expect(() => toForecast(holed, undefined, NOW.getTime())).toThrow(/Missing temperature/);
  });

  it('rejects a response missing sun times', () => {
    const base = makeForecastResponse();
    const noSun = makeForecastResponse({ daily: { ...base.daily, sunrise: [] } });
    expect(() => toForecast(noSun, undefined, NOW.getTime())).toThrow(/sun times/);
  });

  it('rejects a response missing one of the forecast days', () => {
    const base = makeForecastResponse();
    const short = makeForecastResponse({
      daily: { ...base.daily, time: base.daily.time.slice(0, PAST_DAYS + 1) },
    });
    expect(() => toForecast(short, undefined, NOW.getTime())).toThrow(/Missing day/);
  });

  it('defaults optional series to zero rather than failing', () => {
    const base = makeForecastResponse();
    const sparse = makeForecastResponse({
      hourly: {
        ...base.hourly,
        precipitation: base.hourly.precipitation.map(() => null),
        precipitation_probability: base.hourly.precipitation_probability.map(() => null),
      },
    });
    const snapshot = toForecast(sparse, undefined, NOW.getTime()).days[0]?.hourlyWeather[0];
    expect(snapshot?.precipitationMm).toBe(0);
    expect(snapshot?.precipitationProbabilityPercent).toBe(0);
  });

  it('reports a water trend when consecutive days differ', () => {
    const forecast = toForecast(makeForecastResponse(), makeMarineResponse(), NOW.getTime());
    expect(forecast.days[1]?.hourlyWeather[0]?.waterTrendC).toBeCloseTo(0.3, 5);
  });

  it('leaves the night temperature at zero when the daily minimum is missing', () => {
    const base = makeForecastResponse();
    const noMin = makeForecastResponse({
      daily: { ...base.daily, temperature_2m_min: base.daily.temperature_2m_min.map(() => null) },
    });
    expect(
      toForecast(noMin, undefined, NOW.getTime()).days[0]?.hourlyWeather[0]?.nightAirTemperatureC,
    ).toBe(0);
  });
});
