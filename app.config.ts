/**
 * Expo app configuration with build variants.
 *
 * APP_VARIANT selects the variant: development (default), preview, or
 * production. Each variant gets its own name, bundle/package ID, and URL
 * scheme, so all three can be installed side by side. npm scripts and the
 * eas.json build profiles set APP_VARIANT (and the matching
 * EXPO_PUBLIC_APP_ENV for the runtime config in shared/config/env.ts).
 *
 * To make the app yours, change the values in APP below and replace the
 * images in assets/. See docs/app-config.md.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

// ---------------------------------------------------------------------------
// The app's identity: name, IDs, URL scheme, version (docs/app-config.md).
// ---------------------------------------------------------------------------
export const APP = {
  /** Display name shown under the app icon. */
  name: 'RN Starter',
  /** Expo project slug (lowercase, dashes). */
  slug: 'react-native-starter',
  /** Deep-link URL scheme, e.g. rnstarter://. */
  scheme: 'rnstarter',
  /** Reverse-DNS iOS bundle identifier and Android application ID. */
  bundleId: 'com.example.rnstarter',
  /** Marketing version shown in the stores. */
  version: '1.0.0',
  /**
   * Splash background colors (light and dark mode): the theme's
   * `background` in shared/ui/theme.ts, so the splash hands over to the
   * first screen without a flash (a test checks they match).
   */
  splashBackground: { light: '#ffffff', dark: '#151718' },
  /** Android adaptive icon background color. */
  adaptiveIconBackground: '#ffffff',
} as const;
// ---------------------------------------------------------------------------

const VARIANTS = {
  development: { nameSuffix: ' (Dev)', idSuffix: '.dev', schemeSuffix: '-dev' },
  preview: {
    nameSuffix: ' (Preview)',
    idSuffix: '.preview',
    schemeSuffix: '-preview',
  },
  production: { nameSuffix: '', idSuffix: '', schemeSuffix: '' },
} as const;

type Variant = keyof typeof VARIANTS;

function getVariant(): Variant {
  const value = process.env.APP_VARIANT ?? 'development';
  if (!Object.hasOwn(VARIANTS, value)) {
    throw new Error(
      `APP_VARIANT must be one of ${Object.keys(VARIANTS).join(', ')} (got "${value}")`
    );
  }
  return value as Variant;
}

/** Android's largest versionCode. */
const MAX_BUILD_NUMBER = 2100000000;

/**
 * Store build number: iOS buildNumber and Android versionCode. Set
 * APP_BUILD_NUMBER in CI or the build profile and increase it for every
 * store upload.
 */
function getBuildNumber(): number {
  const value = process.env.APP_BUILD_NUMBER ?? '1';
  // Digits only: Number() would also read "1e3", "0x10", or " 42 ".
  const buildNumber = /^\d+$/.test(value) ? Number(value) : NaN;
  if (!(buildNumber >= 1 && buildNumber <= MAX_BUILD_NUMBER)) {
    throw new Error(
      `APP_BUILD_NUMBER must be a whole number from 1 to ${MAX_BUILD_NUMBER} (got "${value}")`
    );
  }
  return buildNumber;
}

/**
 * Android permissions that Expo's template and libraries add but this app
 * doesn't use: vibration, and shared storage (from expo-file-system). Remove
 * an entry when you add a feature that needs it. Release variants also drop
 * SYSTEM_ALERT_WINDOW, which only development tools (the performance
 * overlay) use.
 */
const UNUSED_ANDROID_PERMISSIONS = [
  'android.permission.VIBRATE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getVariant();
  const { nameSuffix, idSuffix, schemeSuffix } = VARIANTS[variant];
  const bundleId = `${APP.bundleId}${idSuffix}`;
  const buildNumber = getBuildNumber();

  return {
    ...config,
    name: `${APP.name}${nameSuffix}`,
    slug: APP.slug,
    version: APP.version,
    scheme: `${APP.scheme}${schemeSuffix}`,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: bundleId,
      buildNumber: String(buildNumber),
      supportsTablet: true,
      // Only HTTPS and the OS's own encryption, which are exempt: App Store
      // Connect then doesn't hold each build at "Missing Compliance". Change
      // it if you add your own cryptography.
      config: { usesNonExemptEncryption: false },
    },
    android: {
      package: bundleId,
      versionCode: buildNumber,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: APP.adaptiveIconBackground,
      },
      predictiveBackGestureEnabled: false,
      blockedPermissions:
        variant === 'development'
          ? UNUSED_ANDROID_PERMISSIONS
          : [
              ...UNUSED_ANDROID_PERMISSIONS,
              'android.permission.SYSTEM_ALERT_WINDOW',
            ],
    },
    web: {
      favicon: './assets/favicon.png',
      // A single-page app, which the hosting notes in docs/getting-started.md
      // describe. Kept explicit so a change of default can't change it.
      output: 'single',
    },
    plugins: [
      'expo-font',
      // No Face ID prompt text: tokens are stored without biometrics
      // (set faceIDPermission to a message if you add requireAuthentication).
      ['expo-secure-store', { faceIDPermission: false }],
      'expo-status-bar',
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: APP.splashBackground.light,
          dark: { backgroundColor: APP.splashBackground.dark },
        },
      ],
    ],
  };
};
