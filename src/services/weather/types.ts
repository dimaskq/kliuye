import type { SunTimes, WeatherSnapshot } from '@/domain/bite-index';
import type { TideDay } from '@/domain/tides';

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
  /** High and low water, where the sea has a tide worth the name. */
  tide?: TideDay | undefined;
};

export type Forecast = {
  /** Epoch milliseconds; drives the "data from HH:MM" badge when offline. */
  fetchedAt: number;
  timezone: string;
  utcOffsetSeconds: number;
  /** Seven days, today first. */
  days: DailyForecast[];
  /** Sea within reach of the spot; `undefined` until it could be checked. */
  seaNearby?: boolean | undefined;
  /**
   * Fresh water at the spot. Not part of the weather answer: the screens add it
   * from the water check, which reads the exact point, not the rounded one.
   */
  freshwaterNearby?: boolean | undefined;
  /** Height of the spot above the sea, in metres, as Open-Meteo's terrain has it. */
  elevationM?: number | undefined;
};
