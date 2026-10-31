import { createContext, useContext, useMemo } from 'react';

import { THEMES, lightColors } from '../tokens/colors';
import type { ColorScheme, Colors } from '../tokens/colors';

type Theme = { scheme: ColorScheme; colors: Colors };

/* Light outside a provider: tests and the dev catalogue render as before. */
const ThemeContext = createContext<Theme>({ scheme: 'light', colors: lightColors });

/**
 * Hands the theme down. Only the components that read a colour re-render when
 * it changes — the navigation state, the forecast and every screen stay put.
 */
export function ThemeProvider({
  scheme,
  children,
}: {
  scheme: ColorScheme;
  children: React.ReactNode;
}): React.JSX.Element {
  const value = useMemo(() => ({ scheme, colors: THEMES[scheme] }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The colours of the theme in use. */
export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

export function useColorTheme(): ColorScheme {
  return useContext(ThemeContext).scheme;
}
