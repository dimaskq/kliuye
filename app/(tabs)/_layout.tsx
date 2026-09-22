import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBiteAlerts } from '@/features/alerts';
import { OfflineNotice } from '@/features/offline';
import { TabBar, colors } from '@/ui';
import type { IconName } from '@/ui';

/** Tabs are data: the order and icons live here, the chrome lives in `TabBar`. */
const TABS: readonly { name: string; labelKey: string; icon: IconName }[] = [
  { name: 'index', labelKey: 'tabs.today', icon: 'lightbulb' },
  { name: 'week', labelKey: 'tabs.week', icon: 'calendar' },
  { name: 'map', labelKey: 'tabs.map', icon: 'map-pin' },
  { name: 'diary', labelKey: 'tabs.diary', icon: 'notebook-pen' },
  { name: 'tips', labelKey: 'tabs.tips', icon: 'activity' },
  { name: 'profile', labelKey: 'tabs.profile', icon: 'user' },
];

/** Keeps the bite alerts scheduled while the app is in use; draws nothing. */
function BiteAlerts(): null {
  useBiteAlerts();
  return null;
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
          animation: 'none',
        }}
        tabBar={({ state, navigation }) => (
          <TabBar
            items={TABS.map((tab, index) => ({
              key: tab.name,
              label: t(tab.labelKey),
              icon: tab.icon,
              selected: state.index === index,
              onPress: () => navigation.navigate(state.routeNames[index] as never),
            }))}
          />
        )}
      >
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} />
        ))}
      </Tabs>
      <OfflineNotice />
      <BiteAlerts />
    </View>
  );
}
