import { clamp01, peakCurve } from '../curves';
import type { FactorScore, BiteInputs } from '../types';

/** New and full moon carry the strongest feeding pushes; quarters are flat. */
const STRONG_PHASES = [0, 0.5, 1] as const;
const PHASE_SPAN = 0.25;
const BASE = 0.35;
const RANGE = 0.6;
const SYNODIC_DAYS = 29.53;

function phaseStrength(phase: number): number {
  return Math.max(...STRONG_PHASES.map((target) => peakCurve(phase, target, PHASE_SPAN, 1.2)));
}

function phaseKey(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'factor.moon.new';
  if (phase < 0.22) return 'factor.moon.waxingCrescent';
  if (phase < 0.28) return 'factor.moon.firstQuarter';
  if (phase < 0.47) return 'factor.moon.waxingGibbous';
  if (phase < 0.53) return 'factor.moon.full';
  if (phase < 0.72) return 'factor.moon.waningGibbous';
  if (phase < 0.78) return 'factor.moon.lastQuarter';
  return 'factor.moon.waningCrescent';
}

export function moonFactor(inputs: BiteInputs): FactorScore {
  const { phase, ageDays } = inputs.moon;
  const normalised = clamp01(phase);

  return {
    id: 'moon',
    score: clamp01(BASE + RANGE * phaseStrength(normalised)),
    confidence: 1,
    explanationKey: phaseKey(normalised),
    explanationParams: { day: Math.max(1, Math.round(ageDays % SYNODIC_DAYS) + 1) },
  };
}
