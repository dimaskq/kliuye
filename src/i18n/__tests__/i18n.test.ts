import {
  computeBiteScore,
  FACTOR_IDS,
  SPECIES_IDS,
  verdictNoteKey,
  verdictWordKey,
} from '@/domain/bite-index';
import { moonStateAt } from '@/domain/moon';
import { SPOTS } from '@/domain/spots';
import { buildTips, TIP_RULES } from '@/domain/tips';
import { TOGGLE_IDS } from '@/store';
import { makeBiteInputs, makeMoon } from '@tests/factories/bite';

import en from '../en.json';
import { SUPPORTED_LANGUAGES, i18next, initI18n } from '../index';
import uk from '../uk.json';

initI18n('uk');

type Bundle = Record<string, unknown>;

function flatten(source: Bundle, prefix = ''): string[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof value === 'object' && value !== null ? flatten(value as Bundle, path) : [path];
  });
}

/** i18next appends a plural suffix, so those keys exist per language. */
const PLURAL_SUFFIX = /_(one|few|many|other)$/;

const base = (key: string): string => key.replace(PLURAL_SUFFIX, '');

function resolves(key: string, language: string): boolean {
  return i18next.exists(key, { lng: language });
}

describe('translation bundles', () => {
  it('cover the same keys in Ukrainian and English', () => {
    const ukKeys = new Set(flatten(uk as Bundle).map(base));
    const enKeys = new Set(flatten(en as Bundle).map(base));
    expect([...ukKeys].filter((key) => !enKeys.has(key))).toEqual([]);
    expect([...enKeys].filter((key) => !ukKeys.has(key))).toEqual([]);
  });

  it('contain no "TODO translate" placeholders', () => {
    expect(JSON.stringify(uk)).not.toMatch(/TODO/i);
    expect(JSON.stringify(en)).not.toMatch(/TODO/i);
  });
});

describe('keys the app generates at runtime', () => {
  const keysUnderTest = (): string[] => {
    const score = computeBiteScore(makeBiteInputs({ moon: makeMoon({ phase: 0.5 }) }));
    return [
      ...SPECIES_IDS.map((id) => `species.${id}`),
      ...FACTOR_IDS.map((id) => `factorCard.${id}`),
      ...TOGGLE_IDS.flatMap((id) => [`settings.${id}`, `settings.${id}Hint`]),
      ...SPOTS.flatMap((spot) => [spot.nameKey, spot.metaKey]),
      ...TIP_RULES.flatMap((rule) => [
        `tips.${rule.id}.title`,
        `tips.${rule.id}.body`,
        `tips.category.${rule.category}`,
        `tips.species.${rule.species}`,
      ]),
      ...score.factors.map((factor) => factor.explanationKey),
      ...buildTips(score.factors).flatMap((tip) => [tip.kickerKey, tip.titleKey, tip.bodyKey]),
      verdictWordKey(score.verdict),
      verdictNoteKey(score.verdict),
      `verdict.${moonStateAt(new Date()).ageDays > -1 ? 'feeding' : 'dead'}.word`,
    ];
  };

  it.each(SUPPORTED_LANGUAGES)('all resolve in %s', (language) => {
    const missing = keysUnderTest().filter((key) => !resolves(key, language));
    expect(missing).toEqual([]);
  });
});
