import type { TextStyle } from 'react-native';

/** Registered font-family names, matching the files in assets/fonts. */
export const fontFamily = {
  headingBold: 'Rubik_700Bold',
  heading: 'Rubik_800ExtraBold',
  headingBlack: 'Rubik_900Black',
  body: 'Figtree_400Regular',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

/** `letterSpacing` in CSS `em` has to become absolute points in React Native. */
const em = (size: number, value: number): number => Math.round(size * value * 100) / 100;

/** DESIGN_SPEC.md §1 typographic scale. Every text style in the app is one of these. */
export const textVariants = {
  display: {
    fontFamily: fontFamily.headingBlack,
    fontSize: 76,
    lineHeight: 70,
    letterSpacing: em(76, -0.04),
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: em(30, -0.02),
  },
  h3: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: em(26, -0.02),
  },
  h4: {
    fontFamily: fontFamily.heading,
    fontSize: 23,
    lineHeight: 26,
    letterSpacing: em(23, -0.02),
  },
  h5: {
    fontFamily: fontFamily.heading,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: em(19, -0.02),
  },
  factorValue: {
    fontFamily: fontFamily.heading,
    fontSize: 25,
    lineHeight: 25,
    letterSpacing: em(25, -0.02),
  },
  numericMd: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    lineHeight: 26,
    letterSpacing: em(26, -0.02),
  },
  numericSm: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: em(24, -0.02),
  },
  numericXs: { fontFamily: fontFamily.heading, fontSize: 17, lineHeight: 20 },
  badge: { fontFamily: fontFamily.heading, fontSize: 13, lineHeight: 16 },
  button: { fontFamily: fontFamily.headingBold, fontSize: 14, lineHeight: 18 },
  body: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 21.7 },
  bodySm: { fontFamily: fontFamily.body, fontSize: 13.5, lineHeight: 20 },
  title: { fontFamily: fontFamily.bodyBold, fontSize: 17, lineHeight: 20.4 },
  rowTitle: { fontFamily: fontFamily.bodyBold, fontSize: 15, lineHeight: 18 },
  label: { fontFamily: fontFamily.bodyBold, fontSize: 14.5, lineHeight: 18 },
  labelSm: { fontFamily: fontFamily.bodyBold, fontSize: 14, lineHeight: 17 },
  pill: { fontFamily: fontFamily.bodyBold, fontSize: 13.5, lineHeight: 18 },
  emphasis: { fontFamily: fontFamily.bodyBold, fontSize: 13, lineHeight: 17 },
  emphasisSm: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, lineHeight: 16 },
  meta: { fontFamily: fontFamily.body, fontSize: 12.5, lineHeight: 17 },
  metaSm: { fontFamily: fontFamily.body, fontSize: 12, lineHeight: 18 },
  factorNote: { fontFamily: fontFamily.bodyBold, fontSize: 12, lineHeight: 16 },
  tag: { fontFamily: fontFamily.bodySemi, fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: fontFamily.body, fontSize: 11.5, lineHeight: 15 },
  kicker: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: em(11, 0.12),
    textTransform: 'uppercase',
  },
  kickerSm: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: em(10.5, 0.07),
    textTransform: 'uppercase',
  },
  kickerWide: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: em(10.5, 0.14),
    textTransform: 'uppercase',
  },
  kickerTip: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: em(10.5, 0.09),
    textTransform: 'uppercase',
  },
  kickerStat: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: em(10.5, 0.05),
    textTransform: 'uppercase',
  },
  kickerMuted: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: em(10.5, 0.06),
  },
  tab: { fontFamily: fontFamily.bodyBold, fontSize: 10.5, lineHeight: 14 },
  tick: { fontFamily: fontFamily.bodyBold, fontSize: 8, lineHeight: 10 },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;
