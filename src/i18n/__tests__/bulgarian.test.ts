import bg from '../bg.json';
import { SUPPORTED_LANGUAGES, i18next, initI18n } from '../index';
import uk from '../uk.json';

initI18n('uk');

type Bundle = Record<string, unknown>;

function values(source: Bundle): string[] {
  return Object.values(source).flatMap((value) =>
    typeof value === 'object' && value !== null ? values(value as Bundle) : [String(value)],
  );
}

describe('Bulgarian', () => {
  it('is offered alongside the other languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('bg');
  });

  it('translates the sentences rather than leaving the Ukrainian in place', () => {
    /*
     * Single words are often genuinely the same in both languages — «Щука»,
     * «Сом», «Вода», «Тактика» — and a string that is mostly placeholders reads
     * the same everywhere. Only real prose is compared: a whole sentence
     * identical in both bundles means it was never translated.
     */
    const PROSE_LENGTH = 20;
    const prose = (value: string): string => value.replace(/\{\{\w+\}\}/g, '');
    const sentences = (source: Bundle): string[] =>
      values(source).filter((value) => prose(value).length >= PROSE_LENGTH);

    const ukrainian = new Set(sentences(uk as Bundle));
    expect(sentences(bg as Bundle).filter((value) => ukrainian.has(value))).toEqual([]);
    expect(sentences(bg as Bundle).length).toBeGreaterThan(50);
  });

  it('covers the whole bundle, not a handful of screens', () => {
    expect(values(bg as Bundle).length).toBeGreaterThan(250);
    expect(values(bg as Bundle).every((value) => value.trim() !== '')).toBe(true);
  });

  it('pluralises the Bulgarian way — one and other, not the Ukrainian three', async () => {
    await i18next.changeLanguage('bg');
    expect(i18next.t('profile.trips', { count: 1 })).toBe('1 излизане');
    expect(i18next.t('profile.trips', { count: 5 })).toBe('5 излизания');
    expect(i18next.t('profile.fish', { count: 1 })).toBe('1 риба');
    expect(i18next.t('profile.fish', { count: 3 })).toBe('3 риби');
    await i18next.changeLanguage('uk');
  });

  it('names the Black Sea species the way Bulgarians do', async () => {
    await i18next.changeLanguage('bg');
    expect(i18next.t('species.turbot')).toBe('Калкан');
    expect(i18next.t('species.flounder')).toBe('Писия');
    expect(i18next.t('species.goby')).toBe('Попче');
    expect(i18next.t('species.zander')).toBe('Бяла риба');
    await i18next.changeLanguage('uk');
  });
});
