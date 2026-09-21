import type { TFunction } from 'i18next';

import type { DailyBiteScore, FactorId, FactorScore } from '@/domain/bite-index';
import { compassPoint } from '@/domain/units';
import type { UnitSystem } from '@/domain/units';
import type { DailyForecast } from '@/services/weather';
import type { TagTone } from '@/ui';
import { formatHour, formatPressure, formatWindSpeed } from '@/utils/format';

export type DayTag = {
  tone: TagTone;
  label: string;
};

export type DayRowModel = {
  date: Date;
  value: number;
  /** "Хмарно, 4 м/с Пд-Зх" — the one-line weather summary. */
  summary: string;
  tags: DayTag[];
};

type Translate = TFunction;

function factor(factors: readonly FactorScore[], id: FactorId): FactorScore | undefined {
  return factors.find((candidate) => candidate.id === id);
}

function windLabel(day: DailyForecast, system: UnitSystem, translate: Translate): string {
  const weather = day.hourlyWeather[0];
  if (weather === undefined) return '';
  const speed = translate(`units.wind${system === 'metric' ? 'Metric' : 'Imperial'}`, {
    value: formatWindSpeed(system, weather.windSpeedMs),
  });
  return `${speed} ${translate(`compass.${compassPoint(weather.windDirectionDeg)}`)}`;
}

function windowTag(score: DailyBiteScore, translate: Translate): DayTag {
  return {
    tone: 'accent',
    label: translate('week.window', {
      start: formatHour(score.bestWindow.startHour),
      end: formatHour(score.bestWindow.endHour),
    }),
  };
}

function pressureTag(day: DailyForecast, system: UnitSystem, translate: Translate): DayTag {
  const weather = day.hourlyWeather[0];
  return {
    tone: 'neutral',
    label: translate('week.pressure', {
      value: weather === undefined ? '' : formatPressure(system, weather.pressureHpa),
    }),
  };
}

function moonTag(score: DailyBiteScore, translate: Translate): DayTag {
  const moon = factor(score.factors, 'moon');
  return {
    tone: 'accent2',
    label: moon === undefined ? '' : translate(moon.explanationKey, moon.explanationParams ?? {}),
  };
}

function tagsFor(
  score: DailyBiteScore,
  day: DailyForecast,
  system: UnitSystem,
  translate: Translate,
): DayTag[] {
  return [
    windowTag(score, translate),
    {
      tone: 'outline',
      label: translate('week.wind', { value: windLabel(day, system, translate) }),
    },
    pressureTag(day, system, translate),
    moonTag(score, translate),
  ];
}

/** Turns a week of scores into rows the list can render without further logic. */
export function toDayRows(
  week: readonly DailyBiteScore[],
  days: readonly DailyForecast[],
  system: UnitSystem,
  translate: Translate,
): DayRowModel[] {
  return week.flatMap((score, index) => {
    const day = days[index];
    if (day === undefined) return [];
    const cloud = factor(score.factors, 'cloudCover');
    return [
      {
        date: new Date(`${day.date}T12:00:00`),
        value: score.value,
        summary: translate('week.summary', {
          cloud:
            cloud === undefined
              ? ''
              : translate(cloud.explanationKey, cloud.explanationParams ?? {}),
          wind: windLabel(day, system, translate),
        }),
        tags: tagsFor(score, day, system, translate),
      },
    ];
  });
}
