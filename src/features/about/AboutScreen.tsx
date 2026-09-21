import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { PRIVACY_URL, SUPPORT_EMAIL } from '@/config/links';
import { Card, NavRow, Screen, Text, colors, space } from '@/ui';

const OPEN_METEO_URL = 'https://open-meteo.com/';

function Section({ title, body }: { title: string; body: string }): React.JSX.Element {
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

/**
 * Disclaimer, data attribution, fishing-rules reminder and privacy — the four
 * things store review looks for (STORE_REVIEW.md §4).
 */
export function AboutScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <Text variant="h2" accessibilityRole="header">
        {t('about.title')}
      </Text>
      <Section title={t('about.disclaimerTitle')} body={t('about.disclaimer')} />
      <Section title={t('about.sourcesTitle')} body={t('about.sources')} />
      <Section title={t('about.rulesTitle')} body={t('about.rules')} />
      <Section title={t('about.privacyTitle')} body={t('about.privacy')} />
      <Card
        radiusToken="tipCard"
        style={{ paddingVertical: space.sm, paddingHorizontal: space.xs }}
      >
        <NavRow
          label={t('about.openMeteo')}
          hint={OPEN_METEO_URL}
          onPress={() => void WebBrowser.openBrowserAsync(OPEN_METEO_URL)}
        />
        <NavRow
          label={t('about.privacyPolicy')}
          hint={PRIVACY_URL}
          onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}
        />
        <NavRow
          label={t('about.contact')}
          hint={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => undefined)}
        />
        <NavRow
          label={t('about.licenses')}
          hint={t('about.licensesTitle')}
          onPress={() => router.push('/licenses')}
        />
      </Card>
      <View>
        <Text variant="caption" color={colors.textAlpha[52]}>
          {t('about.version', { version })}
        </Text>
      </View>
    </Screen>
  );
}
