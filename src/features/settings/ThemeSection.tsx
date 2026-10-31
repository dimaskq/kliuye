import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { THEME_MODES, usePreferences } from '@/store';
import type { ThemeMode } from '@/store';
import { SectionHeader, Segmented } from '@/ui';

/** Light, dark, or whatever the phone is set to. */
export function ThemeSection(): React.JSX.Element {
  const { t } = useTranslation();
  const mode = usePreferences((state) => state.themeMode);
  const setMode = usePreferences((state) => state.setThemeMode);

  return (
    <View>
      <SectionHeader title={t('settings.theme.title')} />
      <Segmented
        segments={THEME_MODES.map((id) => ({ id, label: t(`settings.theme.${id}`) }))}
        selectedId={mode}
        onSelect={(id) => setMode(id as ThemeMode)}
      />
    </View>
  );
}
