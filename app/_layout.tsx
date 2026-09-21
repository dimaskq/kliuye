import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProviders } from '@/providers/AppProviders';
import { ErrorScreen, colors } from '@/ui';

void SplashScreen.preventAutoHideAsync();

const FONTS = {
  Rubik_700Bold: require('../assets/fonts/Rubik_700Bold.ttf'),
  Rubik_800ExtraBold: require('../assets/fonts/Rubik_800ExtraBold.ttf'),
  Rubik_900Black: require('../assets/fonts/Rubik_900Black.ttf'),
  Figtree_400Regular: require('../assets/fonts/Figtree_400Regular.ttf'),
  Figtree_600SemiBold: require('../assets/fonts/Figtree_600SemiBold.ttf'),
  Figtree_700Bold: require('../assets/fonts/Figtree_700Bold.ttf'),
};

/** expo-router renders this instead of crashing the app. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      title={t('error.boundaryTitle')}
      body={__DEV__ ? error.message : t('error.boundaryBody')}
      actionLabel={t('error.restart')}
      onAction={() => void retry()}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitle: '',
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" options={{ headerShown: true }} />
          <Stack.Screen name="species" options={{ headerShown: true }} />
          <Stack.Screen name="catch" options={{ headerShown: true }} />
          <Stack.Screen name="about" options={{ headerShown: true }} />
          <Stack.Screen name="licenses" options={{ headerShown: true }} />
          <Stack.Screen name="dev-catalog" options={{ headerShown: true }} />
        </Stack>
      </AppProviders>
    </SafeAreaProvider>
  );
}
