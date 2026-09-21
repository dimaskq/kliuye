import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

/** DESIGN_SPEC.md §1: radii, elevation, spacing and the fixed component sizes. */
export const radius = {
  sm: 8,
  md: 16,
  tag: 12,
  /** Media thumbnails: rounded, but still clearly a photo and not a chip. */
  thumb: 12,
  factorCard: 20,
  tipCard: 24,
  row: 22,
  lg: 28,
  pill: 999,
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 9,
  xl: 12,
  xxl: 14,
  h: 16,
  section: 18,
  gap: 20,
} as const;

export const screenPadding = {
  today: { paddingTop: 14, paddingHorizontal: 18, paddingBottom: 26 },
  standard: { paddingTop: 16, paddingHorizontal: 18, paddingBottom: 26 },
} as const;

type Elevation = 'sm' | 'md' | 'lg';

const IOS_SHADOWS: Record<Elevation, ViewStyle> = {
  sm: {
    shadowColor: '#2e2b25',
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  md: {
    shadowColor: '#2e2b25',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  lg: {
    shadowColor: '#2e2b25',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
  },
};

const ANDROID_ELEVATION: Record<Elevation, number> = { sm: 1, md: 3, lg: 8 };

/** Elevation reads as a soft ink shadow on iOS and as native elevation on Android. */
export function shadow(level: Elevation): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation: ANDROID_ELEVATION[level] },
    default: IOS_SHADOWS[level],
  });
}

export const shadows = {
  sm: shadow('sm'),
  md: shadow('md'),
  lg: shadow('lg'),
} as const;

/** Store-review §7: the smallest tappable area on either platform. */
export const MIN_TOUCH_SIZE = Platform.OS === 'android' ? 48 : 44;

export const sizes = {
  ring: 196,
  ringRadius: 86,
  ringStrokeWidth: 15,
  /** 2 * π * 86, matching the prototype's stroke-dasharray. */
  ringCircumference: 540.4,
  iconButton: 38,
  hourChartHeight: 96,
  weekTrackHeight: 9,
  weekDayColumn: 44,
  weekScoreColumn: 38,
  spotBadge: 42,
  avatar: 62,
  tipIndex: 34,
  tabPill: { width: 52, height: 28 },
  /** Square media thumbnails: small in a list row, large in the editor. */
  thumbSm: 52,
  thumbLg: 78,
  switchTrack: { width: 46, height: 27 },
  switchThumb: 21,
} as const;

export const iconSize = {
  factor: 13,
  inline: 14,
  header: 15,
  action: 17,
  tab: 20,
} as const;

/**
 * Motion, in milliseconds. DESIGN_SPEC.md §9 fixes the ring and the bars; the
 * accordion is quick enough to feel instant but slow enough to be followed.
 */
export const motion = {
  ring: 600,
  bar: 250,
  expand: 220,
  fadeIn: 160,
  fadeOut: 120,
  /** A status pill gliding in and out: slow enough to be followed. */
  toastIn: 320,
  toastOut: 260,
} as const;

export const ICON_STROKE_WIDTH = 2.75;
export const TAB_ICON_STROKE_WIDTH = 2.4;
