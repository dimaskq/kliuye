import type { FactorId } from '../bite-index/types';

/**
 * "Condition → advice" rules. A rule matches a factor's own explanation key, so
 * adding advice never means touching the scoring model or a screen.
 */
export type TipRule = {
  readonly id: string;
  readonly factorId: FactorId;
  /** The factor explanation this advice answers. */
  readonly explanationKey: string;
  /** i18n key suffix for the category tag. */
  readonly category: string;
  /** i18n key suffix for the species tag. */
  readonly species: string;
};

export const TIP_RULES: readonly TipRule[] = [
  {
    id: 'pressureFalling',
    factorId: 'pressure',
    explanationKey: 'factor.pressure.falling',
    category: 'spinning',
    species: 'pikePerch',
  },
  {
    id: 'pressureRising',
    factorId: 'pressure',
    explanationKey: 'factor.pressure.rising',
    category: 'tactics',
    species: 'all',
  },
  {
    id: 'pressureSteady',
    factorId: 'pressure',
    explanationKey: 'factor.pressure.steady',
    category: 'tactics',
    species: 'all',
  },
  {
    id: 'windRipple',
    factorId: 'wind',
    explanationKey: 'factor.wind.ripple',
    category: 'placement',
    species: 'all',
  },
  {
    id: 'windStrong',
    factorId: 'wind',
    explanationKey: 'factor.wind.strong',
    category: 'placement',
    species: 'all',
  },
  {
    id: 'windCalm',
    factorId: 'wind',
    explanationKey: 'factor.wind.calm',
    category: 'gear',
    species: 'shy',
  },
  {
    id: 'waterWarming',
    factorId: 'waterTemperature',
    explanationKey: 'factor.water.warming',
    category: 'retrieve',
    species: 'predator',
  },
  {
    id: 'waterCooling',
    factorId: 'waterTemperature',
    explanationKey: 'factor.water.cooling',
    category: 'retrieve',
    species: 'predator',
  },
  {
    id: 'waterSteady',
    factorId: 'waterTemperature',
    explanationKey: 'factor.water.steady',
    category: 'retrieve',
    species: 'all',
  },
  {
    id: 'waterUnknown',
    factorId: 'waterTemperature',
    explanationKey: 'factor.water.unknown',
    category: 'data',
    species: 'all',
  },
  {
    id: 'cloudBroken',
    factorId: 'cloudCover',
    explanationKey: 'factor.cloud.broken',
    category: 'lures',
    species: 'shallows',
  },
  {
    id: 'cloudOvercast',
    factorId: 'cloudCover',
    explanationKey: 'factor.cloud.overcast',
    category: 'lures',
    species: 'shallows',
  },
  {
    id: 'cloudClear',
    factorId: 'cloudCover',
    explanationKey: 'factor.cloud.clear',
    category: 'lures',
    species: 'deep',
  },
  {
    id: 'moonNew',
    factorId: 'moon',
    explanationKey: 'factor.moon.new',
    category: 'timing',
    species: 'morning',
  },
  {
    id: 'moonFull',
    factorId: 'moon',
    explanationKey: 'factor.moon.full',
    category: 'timing',
    species: 'night',
  },
  {
    id: 'precipitationDrizzle',
    factorId: 'precipitation',
    explanationKey: 'factor.precipitation.drizzle',
    category: 'weather',
    species: 'midday',
  },
  {
    id: 'precipitationHeavy',
    factorId: 'precipitation',
    explanationKey: 'factor.precipitation.heavy',
    category: 'weather',
    species: 'all',
  },
  {
    id: 'precipitationDry',
    factorId: 'precipitation',
    explanationKey: 'factor.precipitation.dry',
    category: 'weather',
    species: 'all',
  },
  {
    id: 'timeDawn',
    factorId: 'timeOfDay',
    explanationKey: 'factor.time.dawn',
    category: 'timing',
    species: 'morning',
  },
  {
    id: 'timeDusk',
    factorId: 'timeOfDay',
    explanationKey: 'factor.time.dusk',
    category: 'timing',
    species: 'evening',
  },
  {
    id: 'timeDay',
    factorId: 'timeOfDay',
    explanationKey: 'factor.time.day',
    category: 'timing',
    species: 'midday',
  },
  {
    id: 'airWaterWarmer',
    factorId: 'airWaterDelta',
    explanationKey: 'factor.airWater.warmer',
    category: 'tactics',
    species: 'shallows',
  },
  {
    id: 'airWaterColder',
    factorId: 'airWaterDelta',
    explanationKey: 'factor.airWater.colder',
    category: 'tactics',
    species: 'deep',
  },
];
