import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { FactorId } from '@/domain/bite-index';
import { Card, Screen, Text, space, useColors } from '@/ui';

import { FACTORS_BY_WEIGHT as FACTORS } from './FactorWeights';

function Section({ title, body }: { title: string; body: string }): React.JSX.Element {
  const colors = useColors();
  return (
    <Card radiusToken="tipCard" style={{ padding: space.h, gap: space.sm }}>
      <Text variant="h5" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color={colors.textAlpha[72]}>
        {body}
      </Text>
    </Card>
  );
}

function FactorRow({ id, weight }: { id: FactorId; weight: number }): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();
  const share = Math.round(weight * 100);
  return (
    <View
      accessible
      accessibilityLabel={`${t(`howItWorks.factorName.${id}`)}, ${share}%. ${t(`howItWorks.factor.${id}`)}`}
      style={{ gap: space.xxs }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
        <Text variant="label">{t(`howItWorks.factorName.${id}`)}</Text>
        <Text variant="label" color={colors.accent}>
          {`${share}%`}
        </Text>
      </View>
      <Text variant="metaSm" color={colors.textAlpha[68]}>
        {t(`howItWorks.factor.${id}`)}
      </Text>
    </View>
  );
}

/**
 * What the index is made of, in plain words. Without it the number read as a
 * weather forecast with a score stuck on; the weights shown are the ones the
 * model uses, read from the same table.
 */
export function HowItWorksScreen(): React.JSX.Element {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="h2" accessibilityRole="header">
        {t('howItWorks.title')}
      </Text>
      <Text variant="body" color={colors.textAlpha[72]}>
        {t('howItWorks.intro')}
      </Text>
      <Card radiusToken="tipCard" style={{ padding: space.h, gap: space.xl }}>
        <Text variant="h5" accessibilityRole="header">
          {t('howItWorks.factorsTitle')}
        </Text>
        {FACTORS.map(([id, weight]) => (
          <FactorRow key={id} id={id} weight={weight} />
        ))}
      </Card>
      <Section title={t('howItWorks.speciesTitle')} body={t('howItWorks.species')} />
      <Section title={t('howItWorks.seasonTitle')} body={t('howItWorks.season')} />
      <Section title={t('howItWorks.limitsTitle')} body={t('howItWorks.limits')} />
      <Section title={t('howItWorks.presenceTitle')} body={t('howItWorks.presence')} />
    </Screen>
  );
}
