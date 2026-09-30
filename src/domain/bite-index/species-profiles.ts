import { SEA_PROFILES } from './sea-profiles';
import { ALL_YEAR, FAIR, GOOD, NONE, PEAK, POOR } from './seasons';
import type { MonthlyActivity } from './seasons';
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
  /**
   * How well it bites in each month, January first — from Ukrainian and
   * Bulgarian angling calendars for fresh water and the Black Sea, and from
   * Norwegian season calendars and closures for the northern seas.
   */
  readonly activity: MonthlyActivity;
};

export const SPECIES_PROFILES: Readonly<Record<SpeciesId, SpeciesProfile>> = {
  all: {
    habitat: 'any',
    optimalWaterC: [12, 20],
    waterToleranceC: 10,
    windToleranceMs: 6,
    pressureSensitivity: 0.7,
    dielAmplitude: 0.6,
    activity: ALL_YEAR,
  },

  /** Spawns in March; feeds hard after it and again in autumn; sluggish in the summer heat. */
  pike: {
    habitat: 'freshwater',
    optimalWaterC: [8, 16],
    waterToleranceC: 9,
    windToleranceMs: 7,
    pressureSensitivity: 0.85,
    dielAmplitude: 0.7,
    activity: [FAIR, FAIR, POOR, PEAK, GOOD, FAIR, POOR, FAIR, PEAK, PEAK, GOOD, GOOD],
  },
  perch: {
    habitat: 'freshwater',
    optimalWaterC: [10, 19],
    waterToleranceC: 8,
    windToleranceMs: 6,
    pressureSensitivity: 0.7,
    dielAmplitude: 0.75,
    activity: [GOOD, GOOD, PEAK, FAIR, GOOD, GOOD, FAIR, GOOD, PEAK, PEAK, GOOD, GOOD],
  },
  /** Spawns and guards its nest in April–May; best from September to November. */
  zander: {
    habitat: 'freshwater',
    optimalWaterC: [12, 20],
    waterToleranceC: 7,
    windToleranceMs: 5,
    pressureSensitivity: 0.8,
    dielAmplitude: 0.9,
    activity: [FAIR, FAIR, GOOD, POOR, POOR, GOOD, FAIR, GOOD, PEAK, PEAK, PEAK, FAIR],
  },
  /** Deep and slow in winter; bites best in summer and on the pre-spawn run in April. */
  bream: {
    habitat: 'freshwater',
    optimalWaterC: [16, 24],
    waterToleranceC: 6,
    windToleranceMs: 4,
    pressureSensitivity: 0.55,
    dielAmplitude: 0.5,
    activity: [POOR, POOR, FAIR, GOOD, FAIR, PEAK, GOOD, PEAK, GOOD, FAIR, POOR, POOR],
  },
  roach: {
    habitat: 'freshwater',
    optimalWaterC: [12, 22],
    waterToleranceC: 8,
    windToleranceMs: 5,
    pressureSensitivity: 0.5,
    dielAmplitude: 0.45,
    activity: [FAIR, FAIR, GOOD, PEAK, FAIR, GOOD, FAIR, GOOD, PEAK, GOOD, FAIR, FAIR],
  },
  /** Dormant once the water drops below ~6 °C: December to February is off. */
  carp: {
    habitat: 'freshwater',
    optimalWaterC: [18, 26],
    waterToleranceC: 6,
    windToleranceMs: 4,
    pressureSensitivity: 0.45,
    dielAmplitude: 0.35,
    activity: [NONE, NONE, POOR, FAIR, GOOD, PEAK, GOOD, PEAK, PEAK, FAIR, POOR, NONE],
  },
  /** Winters in deep pits and does not feed; wakes at ~10 °C water, late April. */
  catfish: {
    habitat: 'freshwater',
    optimalWaterC: [18, 26],
    waterToleranceC: 7,
    windToleranceMs: 5,
    pressureSensitivity: 0.6,
    dielAmplitude: 0.9,
    activity: [NONE, NONE, NONE, POOR, FAIR, GOOD, PEAK, PEAK, PEAK, FAIR, NONE, NONE],
  },
  /** Buries itself in the silt for the winter; spring and summer fish. */
  crucian: {
    habitat: 'freshwater',
    optimalWaterC: [18, 26],
    waterToleranceC: 7,
    windToleranceMs: 4,
    pressureSensitivity: 0.4,
    dielAmplitude: 0.5,
    activity: [NONE, NONE, POOR, GOOD, PEAK, PEAK, GOOD, GOOD, FAIR, POOR, NONE, NONE],
  },

  ...SEA_PROFILES,
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
