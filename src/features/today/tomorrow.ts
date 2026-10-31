import type { TFunction } from 'i18next';

import type { DailyBiteScore } from '@/domain/bite-index';
import { compassPoint } from '@/domain/units';
import type { UnitSystem } from '@/domain/units';
import type { DailyForecast } from '@/services/weather';
import {
  formatClock,
  formatHour,
  formatPressure,
  formatTemperature,
  formatWindSpeed,
} from '@/utils/format';

export type TomorrowStat = { key: string; label: string; value: string };

export type TomorrowModel = {
  date: Date;
  value: number;
  window: string;
  stats: TomorrowStat[];
  /** "06:12 high water, +0.8 m", in order — only where the sea has a tide. */
  tides: string[];
};

const NOON = 12;
/** A pressure move smaller than this, noon to noon, reads as steady. */
const STEADY_HPA = 1;

function daylight(day: DailyForecast) {
  const from = Math.ceil(day.sun.sunriseHour);
  const to = Math.floor(day.sun.sunsetHour);
  const hours = day.hourlyWeather.slice(from, to + 1);
  return hours.length > 0 ? hours : day.hourlyWeather;
}

function windStat(day: DailyForecast, system: UnitSystem, t: TFunction): TomorrowStat {
  const hours = daylight(day);
  const mean = hours.reduce((sum, hour) => sum + hour.windSpeedMs, 0) / hours.length;
  const strongest = Math.max(...hours.map((hour) => hour.windSpeedMs));
  const noon = day.hourlyWeather[NOON] ?? hours[0]!;
  const unit = system === 'metric' ? 'units.windMetric' : 'units.windImperial';
  return {
    key: 'wind',
    label: t('tomorrow.wind'),
    value: t('tomorrow.windValue', {
      speed: t(unit, { value: formatWindSpeed(system, mean) }),
      gusts: formatWindSpeed(system, strongest),
      direction: t(`compass.${compassPoint(noon.windDirectionDeg)}`),
    }),
  };
}

function pressureStat(
  day: DailyForecast,
  today: DailyForecast | undefined,
  system: UnitSystem,
  t: TFunction,
): TomorrowStat {
  const noon = day.hourlyWeather[NOON]?.pressureHpa ?? 0;
  const before = (today === undefined ? undefined : today.hourlyWeather[NOON])?.pressureHpa ?? noon;
  const change = noon - before;
  const trend = change > STEADY_HPA ? 'rising' : change < -STEADY_HPA ? 'falling' : 'steady';
  return {
    key: 'pressure',
    label: t('tomorrow.pressure'),
    value: t(`tomorrow.pressure_${system}`, {
      value: formatPressure(system, noon),
      trend: t(`tomorrow.trend.${trend}`),
    }),
  };
}

function weatherStats(day: DailyForecast, system: UnitSystem, t: TFunction): TomorrowStat[] {
  const temperatures = day.hourlyWeather.map((hour) => hour.airTemperatureC);
  const rain = Math.max(...day.hourlyWeather.map((hour) => hour.precipitationProbabilityPercent));
  return [
    {
      key: 'air',
      label: t('tomorrow.air'),
      value: t('tomorrow.airValue', {
        low: formatTemperature(system, Math.min(...temperatures)),
        high: formatTemperature(system, Math.max(...temperatures)),
      }),
    },
    {
      key: 'rain',
      label: t('tomorrow.rain'),
      value: t('units.percent', { value: Math.round(rain) }),
    },
  ];
}

function tideLines(day: DailyForecast, t: TFunction): string[] {
  return (day.tide?.turns ?? []).map((turn) =>
    t(`tomorrow.tide_${turn.kind}`, {
      time: formatClock(turn.hour),
      height: `${turn.heightM > 0 ? '+' : ''}${turn.heightM.toFixed(1)}`,
    }),
  );
}

/**
 * Tomorrow at a glance: the bite, the weather that makes it, and the tide where
 * there is one. Everything comes from the forecast already on screen.
 */
export function toTomorrow(
  days: readonly DailyForecast[],
  week: readonly DailyBiteScore[],
  system: UnitSystem,
  t: TFunction,
): TomorrowModel | undefined {
  const day = days[1];
  const score = week[1];
  if (day === undefined || score === undefined || day.hourlyWeather.length === 0) return undefined;
  const [air, rain] = weatherStats(day, system, t);
  return {
    date: new Date(`${day.date}T12:00:00`),
    value: score.value,
    window: t('week.window', {
      start: formatHour(score.bestWindow.startHour),
      end: formatHour(score.bestWindow.endHour),
    }),
    stats: [air!, windStat(day, system, t), pressureStat(day, days[0], system, t), rain!],
    tides: tideLines(day, t),
  };
}
