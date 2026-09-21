/** Every species the app forecasts for. `all` is the mixed baseline. */
export const SPECIES_IDS = [
  'all',
  'pike',
  'perch',
  'zander',
  'bream',
  'roach',
  'carp',
  'catfish',
  'crucian',
  'flounder',
  'turbot',
  'mullet',
  'horseMackerel',
  'bluefish',
  'goby',
] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

/** Where a species is fished. `any` is the mixed baseline, which belongs to neither. */
export const HABITATS = ['any', 'freshwater', 'sea'] as const;
export type Habitat = (typeof HABITATS)[number];

/** Factor order is stable so the UI grid never reshuffles between renders. */
export const FACTOR_IDS = [
  'wind',
  'airWaterDelta',
  'waterTemperature',
  'pressure',
  'moon',
  'precipitation',
  'cloudCover',
  'timeOfDay',
] as const;
export type FactorId = (typeof FACTOR_IDS)[number];

export type VerdictId = 'feeding' | 'good' | 'moderate' | 'weak' | 'dead';

export type FactorScore = {
  id: FactorId;
  /** 0..1 — the factor's normalised contribution. */
  score: number;
  /** 0..1 — how much we trust the underlying data; estimates lower it. */
  confidence: number;
  /** i18n key for the human explanation, e.g. 'factor.pressure.falling'. */
  explanationKey: string;
  explanationParams?: Record<string, string | number>;
};

/** Water temperature is often an estimate; the flag drives the "≈" marker in the UI. */
export type WaterTemperature = {
  celsius: number;
  estimated: boolean;
};

export type WeatherSnapshot = {
  airTemperatureC: number;
  /** Overnight low, shown next to the air temperature. */
  nightAirTemperatureC: number;
  windSpeedMs: number;
  /** Meteorological degrees: the direction the wind blows *from*. */
  windDirectionDeg: number;
  pressureHpa: number;
  /** Same station, 24 h earlier — the trend is what fish react to. */
  pressure24hAgoHpa: number;
  cloudCoverPercent: number;
  precipitationProbabilityPercent: number;
  precipitationMm: number;
  waterTemperature?: WaterTemperature | undefined;
  /** Water warming over the last day, in °C; drives the water factor's note. */
  waterTrendC?: number | undefined;
};

export type SunTimes = {
  sunriseHour: number;
  sunsetHour: number;
};

export type MoonState = {
  /** 0..1 — 0 and 1 are new moon, 0.5 is full moon. */
  phase: number;
  /** Whole days since the last new moon. */
  ageDays: number;
};

export type BiteInputs = {
  species: SpeciesId;
  /** Local hour, 0–23, the score is asked for. */
  hour: number;
  /** Month 1–12, used for the species' seasonal window. */
  month: number;
  weather: WeatherSnapshot;
  /** Per-hour weather for the day, if known; each hour falls back to `weather`. */
  hourlyWeather?: readonly WeatherSnapshot[] | undefined;
  sun: SunTimes;
  moon: MoonState;
  /** Compass bearing, in degrees, of the open water seen from the bank. */
  shoreBearingDeg?: number | undefined;
};

export type BestWindow = {
  startHour: number;
  endHour: number;
};

export type BiteScore = {
  /** 0..100, integer. */
  value: number;
  verdict: VerdictId;
  /** Always all eight factors, in FACTOR_IDS order. */
  factors: FactorScore[];
  bestWindow: BestWindow;
  confidence: number;
};

export type DailyBiteScore = BiteScore & {
  /** Days from today: 0 is today. */
  dayOffset: number;
};

export type WeeklyInputs = {
  species: SpeciesId;
  /** One entry per forecast day, today first. */
  days: readonly Omit<BiteInputs, 'species'>[];
};

export type FactorComputation = (inputs: BiteInputs) => FactorScore;
