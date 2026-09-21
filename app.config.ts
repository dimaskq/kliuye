import type { ExpoConfig } from 'expo/config';

/**
 * Store-review critical choices are made here and justified in RELEASE.md:
 * phone-only, portrait-only, coarse location only, no advertising identifiers.
 */
const BUNDLE_ID = 'ua.kliuye.app';

const LOCATION_PURPOSE_EN =
  'To show the bite forecast for waters near you. You can also pick a water body manually.';

const PHOTOS_PURPOSE_EN =
  'To attach photos and video of your catch to the journal. The files stay on your device.';

const config: ExpoConfig = {
  name: 'Клює',
  slug: 'kliuye',
  version: '1.0.0',
  scheme: 'kliuye',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  assetBundlePatterns: ['**/*'],
  locales: {
    uk: './src/i18n/store/uk.json',
    en: './src/i18n/store/en.json',
    bg: './src/i18n/store/bg.json',
  },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    buildNumber: '1',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription: LOCATION_PURPOSE_EN,
      NSPhotoLibraryUsageDescription: PHOTOS_PURPOSE_EN,
      UIViewControllerBasedStatusBarAppearance: false,
    },
    privacyManifests: {
      /*
       * Coarse location leaves the device — rounded to two decimals — only to
       * fetch the forecast from Open-Meteo. It is never linked to an identity,
       * never used for tracking and never stored, but it is still "collected"
       * in Apple's sense, so it is declared.
       */
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCoarseLocation',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
      ],
      NSPrivacyTracking: false,
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
    },
  },
  android: {
    package: BUNDLE_ID,
    versionCode: 1,
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#f1f5ec',
    },
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
      /* Read-only: it answers "is there a connection", which is what switches
         the app to its cached forecast and its stored map tiles. */
      'android.permission.ACCESS_NETWORK_STATE',
    ],
    blockedPermissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      /* The journal picks media through the system photo picker, which hands
         back only the chosen files and needs no read access to the library. */
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      /* Expo's dev overlay adds this to the merged manifest; we do not ship it. */
      'android.permission.SYSTEM_ALERT_WINDOW',
      /* No ads in v1: without this, Play Console asks for an advertising-ID
         declaration. Remove the line when an ad SDK arrives. */
      'com.google.android.gms.permission.AD_ID',
      /* Notifications are local only: no push service, and the icon never
         carries a badge — so none of the launcher-badge or push permissions
         that expo-notifications' libraries pull in. */
      'com.google.android.c2dm.permission.RECEIVE',
      'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE',
      'android.permission.READ_APP_BADGE',
      'com.sec.android.provider.badge.permission.READ',
      'com.sec.android.provider.badge.permission.WRITE',
      'com.htc.launcher.permission.READ_SETTINGS',
      'com.htc.launcher.permission.UPDATE_SHORTCUT',
      'com.sonyericsson.home.permission.BROADCAST_BADGE',
      'com.sonymobile.home.permission.PROVIDER_INSERT_BADGE',
      'com.anddoes.launcher.permission.UPDATE_COUNT',
      'com.majeur.launcher.permission.UPDATE_BADGE',
      'com.huawei.android.launcher.permission.CHANGE_BADGE',
      'com.huawei.android.launcher.permission.READ_SETTINGS',
      'com.huawei.android.launcher.permission.WRITE_SETTINGS',
      'com.oppo.launcher.permission.READ_SETTINGS',
      'com.oppo.launcher.permission.WRITE_SETTINGS',
      'me.everything.badger.permission.BADGE_COUNT_READ',
      'me.everything.badger.permission.BADGE_COUNT_WRITE',
    ],
  },
  web: {
    /* Browser preview only; the shipped app is iOS + Android. */
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-localization',
    'expo-web-browser',
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Rubik_700Bold.ttf',
          './assets/fonts/Rubik_800ExtraBold.ttf',
          './assets/fonts/Rubik_900Black.ttf',
          './assets/fonts/Figtree_400Regular.ttf',
          './assets/fonts/Figtree_600SemiBold.ttf',
          './assets/fonts/Figtree_700Bold.ttf',
        ],
      },
    ],
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', backgroundColor: '#f1f5ec', imageWidth: 180 },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_PURPOSE_EN,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: PHOTOS_PURPOSE_EN,
        /* No in-app camera: the angler picks a shot they already took, so the
           app ships without CAMERA and without a microphone permission. */
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    ['expo-notifications', { color: '#ff4a1c' }],
    /* MapLibre: free, keyless maps on both platforms (OpenFreeMap tiles). */
    '@maplibre/maplibre-react-native',
    /* Local release builds are signed with the Play upload key from secrets/. */
    './plugins/withReleaseSigning',
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID ?? '00000000-0000-0000-0000-000000000000' },
  },
};

export default config;
