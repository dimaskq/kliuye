/* eslint-disable import/no-named-as-default-member -- i18next's default export is the instance we configure. */
import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import 'intl-pluralrules';

import bg from './bg.json';
import en from './en.json';
import uk from './uk.json';

export const SUPPORTED_LANGUAGES = ['uk', 'en', 'bg'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'uk';

function isSupported(code: string | null | undefined): code is Language {
  return SUPPORTED_LANGUAGES.includes(code as Language);
}

/** The device language when we speak it, Ukrainian otherwise. */
export function detectLanguage(): Language {
  const code = getLocales().at(0)?.languageCode;
  return isSupported(code) ? code : DEFAULT_LANGUAGE;
}

/** Idempotent: the provider may mount more than once in development. */
export function initI18n(language: Language = detectLanguage()): void {
  if (i18next.isInitialized) return;
  void i18next.use(initReactI18next).init({
    resources: { uk: { translation: uk }, en: { translation: en }, bg: { translation: bg } },
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export async function changeLanguage(language: Language): Promise<void> {
  await i18next.changeLanguage(language);
}

export { i18next };
