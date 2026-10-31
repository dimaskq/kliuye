import * as Sentry from '@sentry/react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import type { Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useLeave } from '@/hooks';
import { AppProviders } from '@/providers/AppProviders';
import { ErrorScreen, HeaderBack, useColorTheme, useColors } from '@/ui';

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

/**
 * Every page over the tabs gets the same way back — also when it was the first
 * thing opened, after a reload or from a link, where the system arrow is
 * missing. The journal form goes back to the journal; anything else to Today.
 */
function Back({ fallback }: { fallback: Href }): React.JSX.Element {
  const { t } = useTranslation();
  return <HeaderBack label={t('common.back')} onPress={useLeave(fallback)} />;
}

const backTo = (fallback: Href) => ({
  headerShown: true,
  headerLeft: () => <Back fallback={fallback} />,
});

/** The pages over the tabs, in the colours of the theme in use. */
function RootStack(): React.JSX.Element {
  const colors = useColors();
  const scheme = useColorTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
        <Stack.Screen name="settings" options={backTo('/')} />
        <Stack.Screen name="species" options={backTo('/')} />
        <Stack.Screen name="catch" options={backTo('/diary')} />
        <Stack.Screen name="about" options={backTo('/profile')} />
        <Stack.Screen name="how-it-works" options={backTo('/')} />
        <Stack.Screen name="licenses" options={backTo('/about')} />
        <Stack.Screen name="dev-catalog" options={backTo('/')} />
      </Stack>
    </>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppProviders>
        <RootStack />
      </AppProviders>
    </SafeAreaProvider>
  );
}

/* Catches render errors for the crash report; sends nothing until the angler opts in. */
export default Sentry.wrap(RootLayout);
