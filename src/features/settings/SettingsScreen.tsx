import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useLanguageLabels, useSettingsRows } from '@/hooks';
import { usePreferences } from '@/store';
import {
  Card,
  LanguagePicker,
  NavRow,
  Screen,
  SectionHeader,
  SettingsList,
  Text,
  space,
} from '@/ui';

import { OfflineMapCard } from './OfflineMapCard';

/** The gear on Today: the same rows as the profile tab, on their own screen. */
export function SettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const language = usePreferences((state) => state.language);
  const setLanguage = usePreferences((state) => state.setLanguage);
  const labels = useLanguageLabels();
  const settings = useSettingsRows();

  return (
    <Screen>
      <Text variant="h2" accessibilityRole="header">
        {t('profile.about')}
      </Text>
      <SettingsList rows={settings.rows} onChange={settings.onChange} />
      <OfflineMapCard />
      <View>
        <SectionHeader title={t('profile.language')} />
        <LanguagePicker selected={language} labels={labels} onSelect={setLanguage} />
      </View>
      <Card
        radiusToken="tipCard"
        style={{ paddingVertical: space.sm, paddingHorizontal: space.xs }}
      >
        <NavRow
          label={t('about.title')}
          hint={t('profile.aboutHint')}
          onPress={() => router.push('/about')}
        />
      </Card>
    </Screen>
  );
}
