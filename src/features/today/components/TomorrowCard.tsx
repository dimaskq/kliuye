import { View } from 'react-native';

import { Card, NavRow, ScoreBadge, Text, space, useColors } from '@/ui';

import type { TomorrowModel } from '../tomorrow';

export type TomorrowCardProps = {
  model: TomorrowModel;
  title: string;
  tidesTitle: string;
  weekLabel: string;
  weekHint: string;
  onOpenWeek: () => void;
};

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  const colors = useColors();
  return (
    <View style={{ width: '50%', paddingVertical: space.sm, paddingRight: space.md }}>
      <Text variant="metaSm" color={colors.textAlpha[55]}>
        {label}
      </Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

/**
 * Tomorrow, right on Today: testers never found the Week tab, and "should I go
 * tomorrow" is the next question after "should I go today".
 */
export function TomorrowCard({
  model,
  title,
  tidesTitle,
  weekLabel,
  weekHint,
  onOpenWeek,
}: TomorrowCardProps): React.JSX.Element {
  const colors = useColors();
  return (
    <Card radiusToken="tipCard" style={{ padding: space.h, gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
        <View style={{ flex: 1 }}>
          <Text variant="h5" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="metaSm" color={colors.textAlpha[55]}>
            {model.window}
          </Text>
        </View>
        <ScoreBadge value={model.value} selected={false} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {model.stats.map((stat) => (
          <Stat key={stat.key} label={stat.label} value={stat.value} />
        ))}
      </View>
      {model.tides.length === 0 ? null : (
        <View style={{ gap: space.xxs }}>
          <Text variant="metaSm" color={colors.textAlpha[55]}>
            {tidesTitle}
          </Text>
          {model.tides.map((line) => (
            <Text key={line} variant="label">
              {line}
            </Text>
          ))}
        </View>
      )}
      <View style={{ marginHorizontal: -space.xxl }}>
        <NavRow label={weekLabel} hint={weekHint} onPress={onOpenWeek} />
      </View>
    </Card>
  );
}
