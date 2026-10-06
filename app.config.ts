/**
 * Expo app configuration with build variants.
 *
 * APP_VARIANT selects the variant: development (default), preview, or
 * production. Each variant gets its own name, bundle/package ID, and URL
 * scheme, so all three can be installed side by side. npm scripts and the
 * eas.json build profiles set APP_VARIANT (and the matching
 * EXPO_PUBLIC_APP_ENV for the runtime config in config/env.ts).
 *
 * To make the app yours, change the values in APP below and replace the
 * images in assets/. See "Make it yours" in docs/getting-started.md.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

// ---------------------------------------------------------------------------
// Replace these placeholders with your app's identity.
// ---------------------------------------------------------------------------
const APP = {
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
  /** Splash background colors (light and dark mode). */
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
  if (!(value in VARIANTS)) {
    throw new Error(
      `APP_VARIANT must be one of ${Object.keys(VARIANTS).join(', ')} (got "${value}")`
    );
  }
  return value as Variant;
}

/**
 * Store build number: iOS buildNumber and Android versionCode. Set
 * APP_BUILD_NUMBER in CI or the build profile and increase it for every
 * store upload.
 */
function getBuildNumber(): number {
  const value = process.env.APP_BUILD_NUMBER ?? '1';
  const buildNumber = Number(value);
  if (!Number.isInteger(buildNumber) || buildNumber < 1) {
    throw new Error(
      `APP_BUILD_NUMBER must be a positive integer (got "${value}")`
    );
  }
  return buildNumber;
}

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
    },
    android: {
      package: bundleId,
      versionCode: buildNumber,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: APP.adaptiveIconBackground,
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-secure-store',
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
    extra: {
      appVariant: variant,
    },
  };
};
