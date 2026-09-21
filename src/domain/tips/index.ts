import type { FactorScore } from '../bite-index/types';
import { FACTOR_WEIGHTS } from '../bite-index/weights';

import { TIP_RULES } from './rules';

export type Tip = {
  id: string;
  /** i18n keys — never a ready-made sentence. */
  kickerKey: string;
  kickerParams: Record<string, string | number>;
  titleKey: string;
  bodyKey: string;
  categoryKey: string;
  speciesKey: string;
  /** 0..1 — how far this factor is from neutral, weighted. Drives the order. */
  influence: number;
};

const NEUTRAL_SCORE = 0.5;

/** How much a factor is "saying something", regardless of direction. */
function influenceOf(factor: FactorScore): number {
  return FACTOR_WEIGHTS[factor.id] * Math.abs(factor.score - NEUTRAL_SCORE) * 2;
}

function tipFor(factor: FactorScore): Tip | undefined {
  const rule = TIP_RULES.find(
    (candidate) =>
      candidate.factorId === factor.id && candidate.explanationKey === factor.explanationKey,
  );
  if (rule === undefined) return undefined;

  return {
    id: rule.id,
    kickerKey: factor.explanationKey,
    kickerParams: factor.explanationParams ?? {},
    titleKey: `tips.${rule.id}.title`,
    bodyKey: `tips.${rule.id}.body`,
    categoryKey: `tips.category.${rule.category}`,
    speciesKey: `tips.species.${rule.species}`,
    influence: influenceOf(factor),
  };
}

/**
 * Advice derived from the current factors, strongest signal first — never a
 * random pick from a table.
 */
export function buildTips(factors: readonly FactorScore[]): Tip[] {
  return factors
    .map(tipFor)
    .filter((tip): tip is Tip => tip !== undefined)
    .sort((a, b) => b.influence - a.influence || a.id.localeCompare(b.id));
}

export { TIP_RULES } from './rules';
export type { TipRule } from './rules';
