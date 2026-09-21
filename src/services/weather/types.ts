import type { SunTimes, WeatherSnapshot } from '@/domain/bite-index';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DailyForecast = {
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Calendar month, 1–12, for the species' seasonal window. */
  month: number;
  sun: SunTimes;
  /** 24 snapshots, one per local hour. */
  hourlyWeather: WeatherSnapshot[];
};

export type Forecast = {
  /** Epoch milliseconds; drives the "data from HH:MM" badge when offline. */
  fetchedAt: number;
  timezone: string;
  utcOffsetSeconds: number;
  /** Seven days, today first. */
  days: DailyForecast[];
};
