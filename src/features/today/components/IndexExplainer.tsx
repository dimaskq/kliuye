import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FactorWeights } from '@/features/about';
import { usePreferences } from '@/store';
import { Button, Card, Icon, Text, TextButton, iconSize, space, useColors } from '@/ui';

/** The four heaviest factors already make up most of the number. */
const SHOWN_FACTORS = 4;

/**
 * Right under the first index the angler ever sees: where the number comes
 * from. Testers took it for a weather forecast with a score stuck on, or for a
 * random number; this answers that before the question is asked. It stays until
 * it is read — either button puts it away for good.
 */
export function IndexExplainer(): React.JSX.Element | null {
  const colors = useColors();
  const { t } = useTranslation();
  const router = useRouter();
  const seen = usePreferences((state) => state.explainerSeen);
  const dismiss = usePreferences((state) => state.dismissExplainer);

  if (seen) return null;

  return (
    <Card
      radiusToken="tipCard"
      elevated
      style={{
        padding: space.h,
        gap: space.xl,
        borderWidth: 2,
        borderColor: colors.accent,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Icon name="lightbulb" size={iconSize.action} color={colors.accent} />
        <Text variant="h5" accessibilityRole="header" style={{ flex: 1 }}>
          {t('explainer.title')}
        </Text>
      </View>
      <Text variant="body" color={colors.textAlpha[72]}>
        {t('explainer.body')}
      </Text>
      <FactorWeights limit={SHOWN_FACTORS} />
      <Text variant="metaSm" color={colors.textAlpha[60]}>
        {t('explainer.more')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
        <Button
          label={t('explainer.open')}
          onPress={() => {
            dismiss();
            router.push('/how-it-works');
          }}
        />
        <TextButton label={t('explainer.dismiss')} onPress={dismiss} />
      </View>
    </Card>
  );
}
