import { View } from 'react-native';

import { Card, Tag, Text, colors, radius, sizes, space } from '@/ui';

export type TipRowProps = {
  index: number;
  kicker: string;
  title: string;
  body: string;
  category: string;
  species: string;
  /** The two strongest tips wear the terracotta badge, the rest sage. */
  emphasised: boolean;
};

export function TipRow({
  index,
  kicker,
  title,
  body,
  category,
  species,
  emphasised,
}: TipRowProps): React.JSX.Element {
  return (
    <Card
      radiusToken="tipCard"
      style={{ paddingVertical: space.h, paddingHorizontal: 17, gap: space.md }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <View
          style={{
            width: sizes.tipIndex,
            height: sizes.tipIndex,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: emphasised ? colors.accent300 : colors.accent2300,
          }}
        >
          <Text variant="badge" color={emphasised ? colors.accent900 : colors.accent2900}>
            {index}
          </Text>
        </View>
        <Text variant="kickerTip" color={colors.textAlpha[55]} style={{ flex: 1 }}>
          {kicker}
        </Text>
      </View>
      <Text variant="h5" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color={colors.textAlpha[72]}>
        {body}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xxs }}>
        <Tag tone="outline" label={category} />
        <Tag tone="accent2" label={species} />
      </View>
    </Card>
  );
}
