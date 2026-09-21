import { makeBiteInputs, makeWeather } from '@tests/factories/bite';

import { computeFactors } from '../../bite-index';
import type { FactorScore } from '../../bite-index';
import { TIP_RULES, buildTips } from '../index';

describe('buildTips', () => {
  it('derives advice from the current factors, strongest signal first', () => {
    const tips = buildTips(computeFactors(makeBiteInputs()));
    expect(tips.length).toBeGreaterThan(0);
    const influences = tips.map((tip) => tip.influence);
    expect([...influences].sort((a, b) => b - a)).toEqual(influences);
  });

  it('returns i18n keys, never ready-made sentences', () => {
    buildTips(computeFactors(makeBiteInputs())).forEach((tip) => {
      expect(tip.titleKey).toMatch(/^tips\..+\.title$/);
      expect(tip.bodyKey).toMatch(/^tips\..+\.body$/);
      expect(tip.categoryKey).toMatch(/^tips\.category\./);
      expect(tip.speciesKey).toMatch(/^tips\.species\./);
    });
  });

  it('changes with the weather', () => {
    const calm = buildTips(
      computeFactors(makeBiteInputs({ weather: makeWeather({ windSpeedMs: 0 }) })),
    );
    const blowing = buildTips(
      computeFactors(makeBiteInputs({ weather: makeWeather({ windSpeedMs: 12 }) })),
    );
    expect(calm.map((tip) => tip.id)).toContain('windCalm');
    expect(blowing.map((tip) => tip.id)).toContain('windStrong');
  });

  it('skips factors with no matching rule instead of inventing advice', () => {
    const unmatched: FactorScore = {
      id: 'wind',
      score: 0.9,
      confidence: 1,
      explanationKey: 'factor.wind.unheard-of',
    };
    expect(buildTips([unmatched])).toEqual([]);
  });

  it('breaks influence ties by id so the order is stable', () => {
    const factors: FactorScore[] = [
      { id: 'moon', score: 0.9, confidence: 1, explanationKey: 'factor.moon.full' },
      { id: 'timeOfDay', score: 0.9, confidence: 1, explanationKey: 'factor.time.dawn' },
    ];
    expect(buildTips(factors).map((tip) => tip.id)).toEqual(['moonFull', 'timeDawn']);
  });

  it('carries the factor parameters into the kicker', () => {
    const tips = buildTips(computeFactors(makeBiteInputs()));
    const windTip = tips.find((tip) => tip.id.startsWith('wind'));
    expect(windTip?.kickerParams).toHaveProperty('speed');
  });

  it('keeps every rule id unique', () => {
    const ids = TIP_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
