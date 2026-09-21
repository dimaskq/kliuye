/* Deep imports: Metro does not tree-shake, and the `date-fns` and
   `date-fns/locale` roots would pull in every function and ~90 locales. */
import { format } from 'date-fns/format';
import type { Locale } from 'date-fns/locale';
import { bg } from 'date-fns/locale/bg';
import { enGB } from 'date-fns/locale/en-GB';
import { uk } from 'date-fns/locale/uk';
import { useCallback, useMemo } from 'react';

import type { Language } from '@/i18n';
import { usePreferences } from '@/store';

const LOCALES: Readonly<Record<Language, Locale>> = { uk, en: enGB, bg };

export type DateFormatter = {
  /** "сб, 12 квітня" */
  longDate: (date: Date) => string;
  /** "Сб" */
  weekday: (date: Date) => string;
  /** "12.04" */
  shortDate: (date: Date) => string;
  /** "05:41" */
  time: (date: Date) => string;
};

/** One place that knows how a date reads in the active language. */
export function useDateFormat(): DateFormatter {
  const language = usePreferences((state) => state.language);
  const locale = LOCALES[language];

  const withLocale = useCallback(
    (pattern: string) => (date: Date) => format(date, pattern, { locale }),
    [locale],
  );

  /** date-fns lower-cases Ukrainian weekday and month names; the design capitalises. */
  const capitalised = useCallback(
    (pattern: string) => (date: Date) => {
      const text = format(date, pattern, { locale });
      return text.charAt(0).toLocaleUpperCase(language) + text.slice(1);
    },
    [language, locale],
  );

  return useMemo(
    () => ({
      longDate: withLocale('EEEEEE, d MMMM'),
      weekday: capitalised('EEEEEE'),
      shortDate: withLocale('dd.MM'),
      time: withLocale('HH:mm'),
    }),
    [capitalised, withLocale],
  );
}
