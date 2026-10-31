/**
 * "Float on the water" design-system colours. Source of truth: DESIGN_SPEC.md §1 and
 * design/styles.css. Nothing outside this folder may contain a colour literal.
 *
 * Two themes with one shape: the morning haze (light) and the lake at night
 * (dark). Components never import a theme directly — they read `useColors()`,
 * so every colour follows the theme the angler or the phone has chosen.
 */

export type ColorScheme = 'light' | 'dark';

type Scale = Readonly<Record<100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>>;

export const palette = {
  /** Morning haze over the water: a cool, bright ground. */
  bg: '#f1f5ec',
  surface: '#dfe9e1',
  /** Deep-lake ink. */
  text: '#0e2a33',
  /** Blaze orange — the tip of a float, the colour anglers watch for. */
  accent: '#ff4a1c',
  /** Lake water. */
  accent2: '#1f8a8a',
  /** Chartreuse lure: the one loud highlight on dark water. */
  lure: '#d6ff3d',
  white: '#ffffff',
} as const;

export const neutral: Scale = {
  100: '#f7f9f5',
  200: '#e9eee7',
  300: '#d3dbd3',
  400: '#b3beb6',
  500: '#919e96',
  600: '#717f78',
  700: '#55625c',
  800: '#3a4541',
  900: '#232c2a',
};

export const accent: Scale = {
  100: '#ffede6',
  200: '#ffd3c2',
  300: '#ffb094',
  400: '#ff7d55',
  500: '#ff4a1c',
  600: '#d93a0f',
  700: '#a82c0a',
  800: '#7a1f07',
  900: '#4d1405',
};

export const accent2: Scale = {
  100: '#e3f4f2',
  200: '#c2e6e2',
  300: '#8fd0ca',
  400: '#52b3ac',
  500: '#1f8a8a',
  600: '#177072',
  700: '#11575b',
  800: '#0c3f45',
  900: '#072a30',
};

/**
 * At night a scale runs the other way: the pale tint behind a badge becomes a
 * deep one, and the deep ink on it becomes pale — same contrast, same roles.
 */
function reversed(scale: Scale): Scale {
  return {
    100: scale[900],
    200: scale[800],
    300: scale[700],
    400: scale[600],
    500: scale[500],
    600: scale[400],
    700: scale[300],
    800: scale[200],
    900: scale[100],
  };
}

/** The prototype's `color-mix(text N%, transparent)` levels, resolved to rgba. */
const TEXT_ALPHA_LEVELS = [
  8, 9, 10, 12, 14, 18, 20, 35, 38, 45, 50, 52, 55, 58, 60, 68, 70, 72,
] as const;

type TextAlphaLevel = (typeof TEXT_ALPHA_LEVELS)[number];

function alphaLevels(rgb: string): Record<TextAlphaLevel, string> {
  return Object.fromEntries(
    TEXT_ALPHA_LEVELS.map((level) => [level, `rgba(${rgb}, ${level / 100})`]),
  ) as Record<TextAlphaLevel, string>;
}

export const textAlpha = alphaLevels('14, 42, 51');

type Base = {
  bg: string;
  surface: string;
  text: string;
  accent: string;
  accent2: string;
  lure: string;
  white: string;
};

type Scales = { neutral: Scale; accent: Scale; accent2: Scale };

/** `accent100` … `accent2900`: the flat names the components use. */
function scaleTokens({ accent: a, accent2: b }: Scales) {
  return {
    accent100: a[100],
    accent200: a[200],
    accent300: a[300],
    accent400: a[400],
    accent500: a[500],
    accent600: a[600],
    accent700: a[700],
    accent800: a[800],
    accent900: a[900],
    accent2100: b[100],
    accent2200: b[200],
    accent2300: b[300],
    accent2400: b[400],
    accent2500: b[500],
    accent2600: b[600],
    accent2700: b[700],
    accent2800: b[800],
    accent2900: b[900],
  };
}

function themeOf(
  base: Base,
  scales: Scales,
  alpha: Record<TextAlphaLevel, string>,
  extra: { ink: string; onInk: string; deep: string; scrim: string },
) {
  return {
    ...base,
    divider: alpha[18],
    neutral: scales.neutral,
    ...scaleTokens(scales),
    textAlpha: alpha,
    /** Ink on the blaze accent: light text on hi-vis orange would not read. */
    onAccent: palette.text,
    /** The dark pill and the dark button: lure-green on deep ink. */
    ink: extra.ink,
    onInk: extra.onInk,
    /** The index card: deep water in both themes, and the light words on it. */
    deep: extra.deep,
    onDeep: palette.bg,
    onDarkStrong: 'rgba(241, 245, 236, 0.9)',
    onDarkMuted: 'rgba(241, 245, 236, 0.72)',
    onDarkTrack: 'rgba(241, 245, 236, 0.14)',
    /** Behind a photo shown full screen, whatever the theme. */
    media: '#0b0f0e',
    /** Dims the screen behind a dialog. */
    scrim: extra.scrim,
  } as const;
}

export const lightColors = themeOf(palette, { neutral, accent, accent2 }, textAlpha, {
  ink: palette.text,
  onInk: palette.bg,
  deep: accent2[800],
  scrim: 'rgba(7, 42, 48, 0.55)',
});

export type Colors = typeof lightColors;

export const darkColors: Colors = themeOf(
  {
    /** The lake after dark: deep teal-black, never pure black. */
    bg: '#0b1c21',
    surface: '#15303a',
    text: '#e4ece2',
    accent: '#ff5a2e',
    accent2: '#3aa9a6',
    lure: palette.lure,
    white: palette.white,
  },
  { neutral: reversed(neutral), accent: reversed(accent), accent2: reversed(accent2) },
  alphaLevels('228, 236, 226'),
  { ink: '#050f12', onInk: '#e4ece2', deep: '#0f3a41', scrim: 'rgba(0, 6, 8, 0.66)' },
);

export const THEMES: Readonly<Record<ColorScheme, Colors>> = {
  light: lightColors,
  dark: darkColors,
};
