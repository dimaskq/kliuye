import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { SPOTS } from '@/domain/spots';
import { useCurrentForecast, useLanguageLabels, useSettingsRows } from '@/hooks';
import { initialsOf, useAngler, usePreferences } from '@/store';
import {
  Card,
  LanguagePicker,
  NavRow,
  Screen,
  SectionHeader,
  SettingsList,
  Text,
  colors,
  sizes,
  space,
} from '@/ui';

import { Avatar, EditProfileDialog, ProCard, StatTiles } from './components';
import { useAnglerSummary } from './useAnglerSummary';
import { useProfileEditor } from './useProfileEditor';
import { useProfileStats } from './useProfileStats';

/** Tapping the angler opens their profile for editing. */
function AnglerHeader({ onEdit }: { onEdit: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const displayName = useAngler((state) => state.displayName);
  const avatarUri = useAngler((state) => state.avatarUri);
  const { trips, fish, sinceYear } = useAnglerSummary();
  const name = displayName === '' ? t('profile.defaultName') : displayName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={t('profile.editProfile')}
      onPress={onEdit}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xxl,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Avatar
        uri={avatarUri}
        initials={initialsOf(displayName, t('profile.defaultInitials'))}
        size={sizes.avatar}
        editable
      />
      <View style={{ flex: 1 }}>
        <Text variant="numericSm" accessibilityRole="header">
          {name}
        </Text>
        <Text variant="meta" color={colors.textAlpha[55]}>
          {t('profile.statsSummary', {
            trips: t('profile.trips', { count: trips }),
            fish: t('profile.fish', { count: fish }),
            year: sinceYear,
          })}
        </Text>
      </View>
    </Pressable>
  );
}

/** Local profile, settings and language. No account: the profile never leaves the phone. */
export function ProfileScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const language = usePreferences((state) => state.language);
  const setLanguage = usePreferences((state) => state.setLanguage);
  const labels = useLanguageLabels();
  const { model } = useCurrentForecast();
  const settings = useSettingsRows();
  const { recordKg } = useAnglerSummary();
  const stats = useProfileStats({ week: model?.week, recordKg, spotCount: SPOTS.length });
  const editor = useProfileEditor();

  return (
    <Screen>
      <AnglerHeader onEdit={editor.start} />
      <StatTiles stats={stats} />
      <SettingsList rows={settings.rows} onChange={settings.onChange} />
      <View>
        <SectionHeader title={t('profile.language')} />
        <LanguagePicker selected={language} labels={labels} onSelect={setLanguage} />
      </View>
      <ProCard
        title={t('profile.proTitle')}
        body={t('profile.proBody')}
        soonLabel={t('profile.proSoon')}
      />
      <Card
        radiusToken="tipCard"
        style={{ paddingVertical: space.sm, paddingHorizontal: space.xs }}
      >
        <NavRow
          label={t('profile.about')}
          hint={t('profile.aboutHint')}
          onPress={() => router.push('/about')}
        />
      </Card>
      <EditProfileDialog editor={editor} />
    </Screen>
  );
}
