import { View } from 'react-native';

import { Card, Text, colors, space } from '@/ui';

export type Stat = {
  id: string;
  value: string;
  label: string;
};

/** Three equal tiles: average index, record weight, number of waters. */
export function StatTiles({ stats }: { stats: readonly Stat[] }): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap: space.lg }}>
      {stats.map((stat) => (
        <Card
          key={stat.id}
          radiusToken="factorCard"
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 13,
            paddingHorizontal: space.xl,
          }}
        >
          <Text variant="numericSm">{stat.value}</Text>
          <Text
            variant="kickerStat"
            align="center"
            color={colors.textAlpha[52]}
            style={{ marginTop: 3 }}
          >
            {stat.label}
          </Text>
        </Card>
      ))}
    </View>
  );
}
