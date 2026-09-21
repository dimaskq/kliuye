import { View } from 'react-native';

import { Button, Card, Icon, Text, colors, iconSize, radius, space } from '@/ui';

export type TipCardProps = {
  kicker: string;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
};

/** The blaze-orange card at the foot of Today: one piece of advice, right now. */
export function TipCard({
  kicker,
  title,
  body,
  actionLabel,
  onAction,
}: TipCardProps): React.JSX.Element {
  return (
    <Card
      tone="blaze"
      style={{ paddingTop: space.gap, paddingHorizontal: space.gap, paddingBottom: 22 }}
    >
      <View
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: radius.pill,
          backgroundColor: colors.accent400,
          bottom: -70,
          left: -40,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Icon name="lightbulb" size={iconSize.factor} color={colors.onAccent} />
        <Text variant="kickerTip" color={colors.onAccent}>
          {kicker}
        </Text>
      </View>
      <Text variant="h3" color={colors.onAccent} style={{ marginTop: space.md + 2 }}>
        {title}
      </Text>
      <Text variant="body" color={colors.onAccent} style={{ marginTop: 7 }}>
        {body}
      </Text>
      <Button label={actionLabel} onPress={onAction} tone="ink" style={{ marginTop: 15 }} />
    </Card>
  );
}
