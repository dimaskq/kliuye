import { View } from 'react-native';

import { Card, Icon, ScoreRing, Text, colors, iconSize, radius, sizes, space } from '@/ui';

export type IndexCardProps = {
  value: number;
  /** "ІНДЕКС КЛЬОВУ" — the caption under the number inside the ring. */
  indexLabel: string;
  verdictWord: string;
  verdictNote: string;
  windowLabel: string;
  accessibilityLabel: string;
};

const NOTE_MAX_WIDTH = 290;

/** Ripples spreading from the ring, the way water rings out from a float. */
const RIPPLES = [
  { size: sizes.ring + 56, opacity: 0.16 },
  { size: sizes.ring + 132, opacity: 0.09 },
  { size: sizes.ring + 228, opacity: 0.05 },
] as const;

/** Distance from the card's top edge to the ring's centre. */
const RING_CENTER_Y = 28 + sizes.ring / 2;

function Ripples(): React.JSX.Element {
  return (
    <>
      {RIPPLES.map(({ size, opacity }) => (
        <View
          key={size}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            top: RING_CENTER_Y - size / 2,
            alignSelf: 'center',
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: colors.lure,
            opacity,
          }}
        />
      ))}
    </>
  );
}

function WindowPill({ label }: { label: string }): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginTop: space.gap,
        backgroundColor: colors.lure,
        borderRadius: radius.pill,
        paddingVertical: 10,
        paddingHorizontal: 18,
      }}
    >
      <Icon name="clock" size={iconSize.header} color={colors.text} />
      <Text variant="label" color={colors.text}>
        {label}
      </Text>
    </View>
  );
}

/** The headline: dark water, a blazing ring, the verdict and the best window. */
export function IndexCard({
  value,
  indexLabel,
  verdictWord,
  verdictNote,
  windowLabel,
  accessibilityLabel,
}: IndexCardProps): React.JSX.Element {
  return (
    <Card
      tone="dark"
      elevated
      style={{
        alignItems: 'center',
        paddingTop: 28,
        paddingHorizontal: space.gap,
        paddingBottom: 26,
      }}
    >
      <Ripples />
      <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <ScoreRing value={value} trackColor={colors.onDarkTrack}>
          <Text variant="display" color={colors.bg}>
            {value}
          </Text>
          <Text variant="kickerWide" color={colors.onDarkMuted} style={{ marginTop: space.xs }}>
            {indexLabel}
          </Text>
        </ScoreRing>
      </View>
      <Text variant="h2" align="center" color={colors.bg} style={{ marginTop: space.section }}>
        {verdictWord}
      </Text>
      <Text
        variant="body"
        align="center"
        color={colors.onDarkStrong}
        style={{ marginTop: space.sm, maxWidth: NOTE_MAX_WIDTH }}
      >
        {verdictNote}
      </Text>
      <WindowPill label={windowLabel} />
    </Card>
  );
}
