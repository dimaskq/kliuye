import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '@/i18n';
import type { Language } from '@/i18n';

/**
 * Each language names itself, from a key derived from its own code — so adding
 * one is an entry in `SUPPORTED_LANGUAGES` plus `profile.language<Code>`, and no
 * screen changes.
 */
export function useLanguageLabels(): Record<Language, string> {
  const { t } = useTranslation();

  return Object.fromEntries(
    SUPPORTED_LANGUAGES.map((code) => [
      code,
      t(`profile.language${code.charAt(0).toUpperCase()}${code.slice(1)}`),
    ]),
  ) as Record<Language, string>;
}
