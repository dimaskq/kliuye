/**
 * "Float on the water" design-system colours. Source of truth: DESIGN_SPEC.md §1 and
 * design/styles.css. Nothing outside this folder may contain a colour literal.
 */

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

export const neutral = {
  100: '#f7f9f5',
  200: '#e9eee7',
  300: '#d3dbd3',
  400: '#b3beb6',
  500: '#919e96',
  600: '#717f78',
  700: '#55625c',
  800: '#3a4541',
  900: '#232c2a',
} as const;

export const accent = {
  100: '#ffede6',
  200: '#ffd3c2',
  300: '#ffb094',
  400: '#ff7d55',
  500: '#ff4a1c',
  600: '#d93a0f',
  700: '#a82c0a',
  800: '#7a1f07',
  900: '#4d1405',
} as const;

export const accent2 = {
  100: '#e3f4f2',
  200: '#c2e6e2',
  300: '#8fd0ca',
  400: '#52b3ac',
  500: '#1f8a8a',
  600: '#177072',
  700: '#11575b',
  800: '#0c3f45',
  900: '#072a30',
} as const;

/** The prototype's `color-mix(text N%, transparent)` levels, resolved to rgba. */
const TEXT_ALPHA_LEVELS = [
  8, 9, 10, 12, 14, 18, 20, 35, 38, 45, 50, 52, 55, 58, 60, 68, 70, 72,
] as const;

type TextAlphaLevel = (typeof TEXT_ALPHA_LEVELS)[number];

const TEXT_RGB = '14, 42, 51';

function withAlpha(percent: number): string {
  return `rgba(${TEXT_RGB}, ${percent / 100})`;
}

export const textAlpha = Object.fromEntries(
  TEXT_ALPHA_LEVELS.map((level) => [level, withAlpha(level)]),
) as Record<TextAlphaLevel, string>;

export const colors = {
  ...palette,
  divider: textAlpha[18],
  neutral,
  accent100: accent[100],
  accent200: accent[200],
  accent300: accent[300],
  accent400: accent[400],
  accent500: accent[500],
  accent600: accent[600],
  accent700: accent[700],
  accent800: accent[800],
  accent900: accent[900],
  accent2100: accent2[100],
  accent2200: accent2[200],
  accent2300: accent2[300],
  accent2400: accent2[400],
  accent2500: accent2[500],
  accent2600: accent2[600],
  accent2700: accent2[700],
  accent2800: accent2[800],
  accent2900: accent2[900],
  textAlpha,
  /** Ink on the blaze accent: light text on hi-vis orange would not read. */
  onAccent: palette.text,
  onDarkStrong: 'rgba(241, 245, 236, 0.9)',
  onDarkMuted: 'rgba(241, 245, 236, 0.72)',
  onDarkTrack: 'rgba(241, 245, 236, 0.14)',
  /** Dims the screen behind a dialog. */
  scrim: 'rgba(7, 42, 48, 0.55)',
} as const;

export type Colors = typeof colors;
