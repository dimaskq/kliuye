import { FAIR, GOOD, NONE, PEAK, POOR } from './seasons';
import type { SpeciesProfile } from './species-profiles';

/**
 * The sea fish, kept apart from the freshwater table only for length. Every
 * species here is ruled out — index 0 — at a spot with no sea within reach.
 */
export const SEA_PROFILES = {
  /** Moves off the shore in the summer heat and comes back in September. */
  flounder: {
    habitat: 'sea',
    optimalWaterC: [6, 14],
    waterToleranceC: 8,
    windToleranceMs: 8,
    pressureSensitivity: 0.5,
    dielAmplitude: 0.35,
    activity: [GOOD, GOOD, PEAK, PEAK, GOOD, POOR, POOR, POOR, GOOD, PEAK, PEAK, GOOD],
  },
  turbot: {
    habitat: 'sea',
    optimalWaterC: [8, 16],
    waterToleranceC: 7,
    windToleranceMs: 7,
    pressureSensitivity: 0.55,
    dielAmplitude: 0.4,
    activity: [FAIR, FAIR, GOOD, PEAK, GOOD, FAIR, POOR, POOR, FAIR, GOOD, GOOD, FAIR],
  },
  /** Best in August–October, feeding up before the winter. */
  mullet: {
    habitat: 'sea',
    optimalWaterC: [16, 24],
    waterToleranceC: 6,
    windToleranceMs: 5,
    pressureSensitivity: 0.6,
    dielAmplitude: 0.6,
    activity: [POOR, POOR, POOR, FAIR, GOOD, GOOD, GOOD, PEAK, PEAK, PEAK, FAIR, POOR],
  },
  /** Leaves the shelf for the winter; comes in with warm water in May. */
  horseMackerel: {
    habitat: 'sea',
    optimalWaterC: [15, 22],
    waterToleranceC: 6,
    windToleranceMs: 5,
    pressureSensitivity: 0.65,
    dielAmplitude: 0.8,
    activity: [NONE, NONE, NONE, POOR, GOOD, GOOD, GOOD, PEAK, PEAK, PEAK, FAIR, NONE],
  },
  /** A migrant from the Sea of Marmara: here from late summer, best in October. */
  bluefish: {
    habitat: 'sea',
    optimalWaterC: [18, 24],
    waterToleranceC: 5,
    windToleranceMs: 6,
    pressureSensitivity: 0.7,
    dielAmplitude: 0.85,
    activity: [NONE, NONE, NONE, NONE, NONE, NONE, POOR, GOOD, PEAK, PEAK, GOOD, POOR],
  },
  /** Always about; best in spring and autumn, deeper and slower in winter. */
  goby: {
    habitat: 'sea',
    optimalWaterC: [10, 24],
    waterToleranceC: 8,
    windToleranceMs: 6,
    pressureSensitivity: 0.4,
    dielAmplitude: 0.35,
    activity: [POOR, POOR, FAIR, GOOD, FAIR, FAIR, FAIR, GOOD, PEAK, PEAK, GOOD, FAIR],
  },

  /* The northern seas — the Norwegian coast, the North Sea and the Baltic. */
  /** All year along the coast; big fish in July–August. */
  saithe: {
    habitat: 'sea',
    optimalWaterC: [7, 13],
    waterToleranceC: 6,
    windToleranceMs: 7,
    pressureSensitivity: 0.55,
    dielAmplitude: 0.7,
    activity: [GOOD, GOOD, FAIR, FAIR, GOOD, GOOD, PEAK, PEAK, GOOD, GOOD, FAIR, FAIR],
  },
  /**
   * All year; the skrei spawning run peaks in March–April. The local closures —
   * the Oslofjord all year, the Skagerrak coast January to April — are not modelled.
   */
  cod: {
    habitat: 'sea',
    optimalWaterC: [4, 10],
    waterToleranceC: 6,
    windToleranceMs: 8,
    pressureSensitivity: 0.45,
    dielAmplitude: 0.4,
    activity: [GOOD, GOOD, PEAK, PEAK, GOOD, GOOD, FAIR, FAIR, GOOD, GOOD, GOOD, GOOD],
  },
  /** A summer visitor: arrives at the end of May, gone by October. */
  mackerel: {
    habitat: 'sea',
    optimalWaterC: [11, 17],
    waterToleranceC: 5,
    windToleranceMs: 6,
    pressureSensitivity: 0.65,
    dielAmplitude: 0.8,
    activity: [NONE, NONE, NONE, NONE, POOR, FAIR, PEAK, PEAK, FAIR, NONE, NONE, NONE],
  },
  /**
   * Trolled in the fjords and along the coast as it runs for the rivers, peaking
   * in July; river fishing itself is not modelled.
   */
  salmon: {
    habitat: 'sea',
    optimalWaterC: [8, 15],
    waterToleranceC: 6,
    windToleranceMs: 7,
    pressureSensitivity: 0.6,
    dielAmplitude: 0.75,
    activity: [NONE, NONE, NONE, NONE, FAIR, FAIR, PEAK, PEAK, FAIR, NONE, NONE, NONE],
  },
  /** Protected in Norway from 20 December to 31 March, rod fishing included. */
  halibut: {
    habitat: 'sea',
    optimalWaterC: [5, 11],
    waterToleranceC: 6,
    windToleranceMs: 7,
    pressureSensitivity: 0.5,
    dielAmplitude: 0.4,
    activity: [NONE, NONE, NONE, PEAK, GOOD, GOOD, GOOD, GOOD, PEAK, PEAK, POOR, NONE],
  },
} satisfies Record<string, SpeciesProfile>;
