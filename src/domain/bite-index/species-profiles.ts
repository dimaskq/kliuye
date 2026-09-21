import type { Habitat, SpeciesId } from './types';

/**
 * Species behaviour as data. Every `if (species === …)` in the app belongs here
 * and nowhere else — adding a species is one entry in this table plus its two
 * i18n keys, and no screen changes.
 */
export type SpeciesProfile = {
  readonly habitat: Habitat;
  /** Water temperature band, in °C, where the species feeds best. */
  readonly optimalWaterC: readonly [number, number];
  /** Half-width, in °C, of the tolerated deviation outside the optimum. */
  readonly waterToleranceC: number;
  /** Wind speed, m/s, the species tolerates before the score decays. */
  readonly windToleranceMs: number;
  /** 0..1 — how strongly a pressure change moves the score. */
  readonly pressureSensitivity: number;
  /** 0..1 — how much the dawn/dusk peaks dominate the daily curve. */
  readonly dielAmplitude: number;
  /** Months (1–12) in which the species is actively targeted. */
  readonly seasonMonths: readonly number[];
};

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const OPEN_WATER = [3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const WARM_SEASON = [5, 6, 7, 8, 9, 10] as const;
const COLD_SEASON = [1, 2, 3, 4, 10, 11, 12] as const;
const LATE_SUMMER = [7, 8, 9, 10] as const;

export const SPECIES_PROFILES: Readonly<Record<SpeciesId, SpeciesProfile>> = {
  all: {
    habitat: 'any',
    optimalWaterC: [12, 20],
    waterToleranceC: 10,
    windToleranceMs: 6,
    pressureSensitivity: 0.7,
    dielAmplitude: 0.6,
    seasonMonths: ALL_YEAR,
  },

  pike: {
    habitat: 'freshwater',
    optimalWaterC: [8, 16],
    waterToleranceC: 9,
    windToleranceMs: 7,
    pressureSensitivity: 0.85,
    dielAmplitude: 0.7,
    seasonMonths: OPEN_WATER,
  },
  perch: {
    habitat: 'freshwater',
    optimalWaterC: [10, 19],
    waterToleranceC: 8,
    windToleranceMs: 6,
    pressureSensitivity: 0.7,
    dielAmplitude: 0.75,
    seasonMonths: ALL_YEAR,
  },
  zander: {
    habitat: 'freshwater',
    optimalWaterC: [12, 20],
    waterToleranceC: 7,
    windToleranceMs: 5,
    pressureSensitivity: 0.8,
    dielAmplitude: 0.9,
    seasonMonths: OPEN_WATER,
  },
  bream: {
    habitat: 'freshwater',
    optimalWaterC: [16, 24],
    waterToleranceC: 6,
    windToleranceMs: 4,
    pressureSensitivity: 0.55,
    dielAmplitude: 0.5,
    seasonMonths: WARM_SEASON,
  },
  roach: {
    habitat: 'freshwater',
    optimalWaterC: [12, 22],
    waterToleranceC: 8,
    windToleranceMs: 5,
    pressureSensitivity: 0.5,
    dielAmplitude: 0.45,
    seasonMonths: ALL_YEAR,
  },
  carp: {
    habitat: 'freshwater',
    optimalWaterC: [18, 26],
    waterToleranceC: 6,
    windToleranceMs: 4,
    pressureSensitivity: 0.45,
    dielAmplitude: 0.35,
    seasonMonths: WARM_SEASON,
  },
  catfish: {
    habitat: 'freshwater',
    optimalWaterC: [18, 26],
    waterToleranceC: 7,
    windToleranceMs: 5,
    pressureSensitivity: 0.6,
    dielAmplitude: 0.9,
    seasonMonths: WARM_SEASON,
  },
  crucian: {
    habitat: 'freshwater',
    optimalWaterC: [18, 26],
    waterToleranceC: 7,
    windToleranceMs: 4,
    pressureSensitivity: 0.4,
    dielAmplitude: 0.5,
    seasonMonths: WARM_SEASON,
  },

  flounder: {
    habitat: 'sea',
    optimalWaterC: [6, 14],
    waterToleranceC: 8,
    windToleranceMs: 8,
    pressureSensitivity: 0.5,
    dielAmplitude: 0.35,
    seasonMonths: COLD_SEASON,
  },
  turbot: {
    habitat: 'sea',
    optimalWaterC: [8, 16],
    waterToleranceC: 7,
    windToleranceMs: 7,
    pressureSensitivity: 0.55,
    dielAmplitude: 0.4,
    seasonMonths: [4, 5, 6, 9, 10, 11],
  },
  mullet: {
    habitat: 'sea',
    optimalWaterC: [16, 24],
    waterToleranceC: 6,
    windToleranceMs: 5,
    pressureSensitivity: 0.6,
    dielAmplitude: 0.6,
    seasonMonths: [6, 7, 8, 9, 10],
  },
  horseMackerel: {
    habitat: 'sea',
    optimalWaterC: [15, 22],
    waterToleranceC: 6,
    windToleranceMs: 5,
    pressureSensitivity: 0.65,
    dielAmplitude: 0.8,
    seasonMonths: WARM_SEASON,
  },
  bluefish: {
    habitat: 'sea',
    optimalWaterC: [18, 24],
    waterToleranceC: 5,
    windToleranceMs: 6,
    pressureSensitivity: 0.7,
    dielAmplitude: 0.85,
    seasonMonths: LATE_SUMMER,
  },
  goby: {
    habitat: 'sea',
    optimalWaterC: [10, 24],
    waterToleranceC: 8,
    windToleranceMs: 6,
    pressureSensitivity: 0.4,
    dielAmplitude: 0.35,
    seasonMonths: ALL_YEAR,
  },
};

export function profileFor(species: SpeciesId): SpeciesProfile {
  return SPECIES_PROFILES[species];
}

/** The species of one habitat, in catalogue order. */
export function speciesOf(habitat: Habitat): SpeciesId[] {
  return (Object.keys(SPECIES_PROFILES) as SpeciesId[]).filter(
    (id) => SPECIES_PROFILES[id].habitat === habitat,
  );
}
