import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon, Text, colors, iconSize, space } from '@/ui';

import type { FactorCardModel, FactorTone } from '../factorCards';

const NOTE_COLOR: Record<FactorTone, string> = {
  positive: colors.accent2700,
  attention: colors.accent700,
  neutral: colors.textAlpha[55],
};

function FactorCard({ card }: { card: FactorCardModel }): React.JSX.Element {
  const { t } = useTranslation();
  const label = t(card.labelKey);
  const note = t(card.noteKey, card.noteParams);

  return (
    <Card
      radiusToken="factorCard"
      accessible
      accessibilityLabel={t('factorCard.accessible', { label, value: card.value, note })}
      style={{ flexGrow: 1, flexBasis: '47%', paddingVertical: 13, paddingHorizontal: space.xxl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon name={card.icon} size={iconSize.factor} color={colors.textAlpha[55]} />
        <Text variant="kickerSm" color={colors.textAlpha[55]}>
          {label}
        </Text>
      </View>
      <Text variant="factorValue" style={{ marginTop: space.sm }}>
        {card.value}
      </Text>
      <Text variant="factorNote" color={NOTE_COLOR[card.tone]} style={{ marginTop: 3 }}>
        {note}
      </Text>
    </Card>
  );
}

/** Two-column grid of the eight factors the index is built from. */
export function FactorGrid({ cards }: { cards: readonly FactorCardModel[] }): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
      {cards.map((card) => (
        <FactorCard key={card.id} card={card} />
      ))}
    </View>
  );
}
