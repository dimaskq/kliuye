import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FACTOR_WEIGHTS } from '@/domain/bite-index';
import type { FactorId } from '@/domain/bite-index';
import { Text, radius, space, useColors } from '@/ui';

/** Heaviest first: the order says what matters most before a word is read. */
export const FACTORS_BY_WEIGHT = (Object.entries(FACTOR_WEIGHTS) as [FactorId, number][]).sort(
  ([, a], [, b]) => b - a,
);

const HEAVIEST = FACTORS_BY_WEIGHT[0]?.[1] ?? 1;
const LABEL_WIDTH = 82;
const BAR_HEIGHT = 8;

export type FactorWeightsProps = {
  /** Only the heaviest few, where space is short. */
  limit?: number;
};

/**
 * What the index is made of, at a glance: one bar per factor, as long as its
 * weight in the model. Read from the same table the model uses, so the picture
 * can never drift from the arithmetic.
 */
export function FactorWeights({ limit }: FactorWeightsProps): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  const rows = FACTORS_BY_WEIGHT.slice(0, limit ?? FACTORS_BY_WEIGHT.length);

  return (
    <View style={{ gap: space.sm }}>
      {rows.map(([id, weight]) => {
        const share = Math.round(weight * 100);
        const name = t(`factorCard.${id}`);
        return (
          <View
            key={id}
            accessible
            accessibilityLabel={`${name}, ${share}%`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}
          >
            <Text variant="metaSm" style={{ width: LABEL_WIDTH }} numberOfLines={1}>
              {name}
            </Text>
            <View
              style={{
                flex: 1,
                height: BAR_HEIGHT,
                borderRadius: radius.pill,
                backgroundColor: colors.textAlpha[9],
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${(weight / HEAVIEST) * 100}%`,
                  height: BAR_HEIGHT,
                  borderRadius: radius.pill,
                  backgroundColor: colors.accent,
                }}
              />
            </View>
            <Text
              variant="emphasisSm"
              color={colors.textAlpha[68]}
              style={{ width: 34, textAlign: 'right' }}
            >
              {`${share}%`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
