import type { TFunction } from 'i18next';

import type { FactorId, FactorScore, WeatherSnapshot } from '@/domain/bite-index';
import type { UnitSystem } from '@/domain/units';
import { compassPoint } from '@/domain/units';
import type { IconName } from '@/ui';
import {
  formatClock,
  formatDelta,
  formatPercent,
  formatPressure,
  formatTemperature,
  formatWindSpeed,
} from '@/utils/format';

export type FactorTone = 'positive' | 'attention' | 'neutral';

export type FactorCardModel = {
  id: FactorId;
  icon: IconName;
  labelKey: string;
  /** Already localised — the value is a number or a phase word. */
  value: string;
  noteKey: string;
  noteParams: Record<string, string | number>;
  tone: FactorTone;
};

const ICONS: Readonly<Record<FactorId, IconName>> = {
  wind: 'wind',
  airWaterDelta: 'thermometer',
  waterTemperature: 'waves',
  pressure: 'gauge',
  moon: 'moon-star',
  precipitation: 'cloud-rain-wind',
  cloudCover: 'cloud',
  timeOfDay: 'sunrise',
};

const POSITIVE_FROM = 0.6;
const ATTENTION_BELOW = 0.4;

/** DESIGN_SPEC §4.5: green means a positive influence, terracotta means watch out. */
function toneFor(score: number): FactorTone {
  if (score >= POSITIVE_FROM) return 'positive';
  if (score <= ATTENTION_BELOW) return 'attention';
  return 'neutral';
}

type Context = {
  weather: WeatherSnapshot;
  system: UnitSystem;
  sunriseHour: number;
  sunsetHour: number;
  /** Localises the moon phase word, which is a value rather than a note. */
  translate: TFunction;
};

const NO_READING = '—';

/** An estimate is always shown as such — never dressed up as a measurement. */
function waterValue(context: Context): string {
  const { weather, system, translate } = context;
  const water = weather.waterTemperature;
  if (water === undefined) return NO_READING;
  const reading = translate('units.temperature', {
    value: formatTemperature(system, water.celsius),
  });
  return water.estimated ? `${translate('common.approx')} ${reading}` : reading;
}

/** One card per factor; a new factor gets an icon here and needs no screen change. */
function valueFor(factor: FactorScore, context: Context): string {
  const { weather, system, translate } = context;
  switch (factor.id) {
    case 'wind':
      return translate(`units.wind${system === 'metric' ? 'Metric' : 'Imperial'}`, {
        value: formatWindSpeed(system, weather.windSpeedMs),
      });
    case 'airWaterDelta':
      return translate('units.temperature', {
        value: formatTemperature(system, weather.airTemperatureC),
      });
    case 'waterTemperature':
      return waterValue(context);
    case 'pressure':
      return formatPressure(system, weather.pressureHpa);
    case 'moon':
      return translate(factor.explanationKey);
    case 'precipitation':
      return translate('units.percent', {
        value: formatPercent(weather.precipitationProbabilityPercent),
      });
    case 'cloudCover':
      return translate('units.percent', { value: formatPercent(weather.cloudCoverPercent) });
    case 'timeOfDay':
      return formatClock(context.sunriseHour);
  }
}

function noteFor(
  factor: FactorScore,
  context: Context,
): { key: string; params: Record<string, string | number> } {
  if (factor.id === 'moon') {
    return { key: 'factor.moon.day', params: { day: factor.explanationParams?.['day'] ?? 1 } };
  }
  if (factor.id === 'timeOfDay') {
    return { key: 'factor.time.sunset', params: { time: formatClock(context.sunsetHour) } };
  }
  const params = { ...(factor.explanationParams ?? {}) };
  if (factor.id === 'wind' && typeof params['direction'] === 'number') {
    params['direction'] = context.translate(`compass.${compassPoint(params['direction'])}`);
  }
  if (factor.id === 'waterTemperature' && typeof params['trend'] === 'number') {
    params['trend'] = formatDelta(params['trend']);
  }
  if (factor.id === 'pressure' && typeof params['delta'] === 'number') {
    params['delta'] = Math.abs(params['delta']);
  }
  return { key: factor.explanationKey, params };
}

export function toFactorCards(
  factors: readonly FactorScore[],
  context: Context,
): FactorCardModel[] {
  return factors.map((factor) => {
    const note = noteFor(factor, context);
    return {
      id: factor.id,
      icon: ICONS[factor.id],
      labelKey: `factorCard.${factor.id}`,
      value: valueFor(factor, context),
      noteKey: note.key,
      noteParams: note.params,
      tone: toneFor(factor.score),
    };
  });
}
