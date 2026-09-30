import { SUPPORTED_LANGUAGES, i18next, initI18n } from '../index';
import ru from '../ru.json';
import uk from '../uk.json';

initI18n('uk');

type Bundle = Record<string, unknown>;

function values(source: Bundle): string[] {
  return Object.values(source).flatMap((value) =>
    typeof value === 'object' && value !== null ? values(value as Bundle) : [String(value)],
  );
}

describe('Russian', () => {
  it('is offered alongside the other languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('ru');
  });

  it('translates the sentences rather than leaving the Ukrainian in place', () => {
    /* The same rule as for Bulgarian: short words may match, whole sentences may not. */
    const PROSE_LENGTH = 20;
    const prose = (value: string): string => value.replace(/\{\{\w+\}\}/g, '');
    const sentences = (source: Bundle): string[] =>
      values(source).filter((value) => prose(value).length >= PROSE_LENGTH);

    const ukrainian = new Set(sentences(uk as Bundle));
    expect(sentences(ru as Bundle).filter((value) => ukrainian.has(value))).toEqual([]);
    expect(sentences(ru as Bundle).length).toBeGreaterThan(50);
  });

  it('covers the whole bundle, not a handful of screens', () => {
    expect(values(ru as Bundle).length).toBeGreaterThan(250);
    expect(values(ru as Bundle).every((value) => value.trim() !== '')).toBe(true);
  });

  it('pluralises the Russian way — one, few and many', async () => {
    await i18next.changeLanguage('ru');
    expect(i18next.t('profile.trips', { count: 1 })).toBe('1 выход');
    expect(i18next.t('profile.trips', { count: 3 })).toBe('3 выхода');
    expect(i18next.t('profile.trips', { count: 5 })).toBe('5 выходов');
    expect(i18next.t('profile.fish', { count: 21 })).toBe('21 рыба');
    expect(i18next.t('profile.fish', { count: 22 })).toBe('22 рыбы');
    expect(i18next.t('profile.fish', { count: 11 })).toBe('11 рыб');
    await i18next.changeLanguage('uk');
  });

  it('names the fish the Russian way', async () => {
    await i18next.changeLanguage('ru');
    expect(i18next.t('species.roach')).toBe('Плотва');
    expect(i18next.t('species.bream')).toBe('Лещ');
    expect(i18next.t('species.goby')).toBe('Бычок');
    await i18next.changeLanguage('uk');
  });
});
