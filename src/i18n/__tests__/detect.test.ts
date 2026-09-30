import { getLocales } from 'expo-localization';

import type { usePreferences as UsePreferences } from '@/store';

import { DEFAULT_LANGUAGE, detectLanguage } from '../index';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const locales = jest.mocked(getLocales);

function deviceIn(languageCode: string | null): void {
  locales.mockReturnValue([{ languageCode } as ReturnType<typeof getLocales>[number]]);
}

describe('detectLanguage', () => {
  it.each(['uk', 'en', 'bg', 'ru'])('follows a device set to %s', (code) => {
    deviceIn(code);
    expect(detectLanguage()).toBe(code);
  });

  it('falls back to English for a language we do not speak', () => {
    deviceIn('de');
    expect(detectLanguage()).toBe('en');
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('falls back to English when the device reports no language', () => {
    deviceIn(null);
    expect(detectLanguage()).toBe('en');
  });
});

describe('the first-launch language', () => {
  it('is the device language, not a hard-coded one', () => {
    deviceIn('bg');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh store per device language
      const { usePreferences } = require('@/store') as { usePreferences: typeof UsePreferences };
      expect(usePreferences.getState().language).toBe('bg');
    });
  });
});
