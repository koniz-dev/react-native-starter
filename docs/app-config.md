# App Config

The app's identity, build variants, and native assets, all set in
`app.config.ts`, `eas.json`, and `assets/`.

## Identity

| What                                                          | Where                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| App name, slug, URL scheme, bundle / package ID, version      | the `APP` block at the top of `app.config.ts`                                   |
| Store build number (iOS `buildNumber`, Android `versionCode`) | `APP_BUILD_NUMBER` at build time (default `1`); raise it for every store upload |
| Splash and adaptive-icon background colors                    | `APP.splashBackground`, `APP.adaptiveIconBackground` in `app.config.ts`         |
| Per-variant build settings and env for EAS Build              | `eas.json` build profiles                                                       |

Run `npm run config:print` to see the resolved config
(`APP_VARIANT=preview npm run config:print` for another variant).

## Build variants

`APP_VARIANT` selects one of three variants in `app.config.ts`. Each gets its
own name, bundle ID, and scheme, so all three install side by side:

| Variant                 | Name                   | Bundle / package ID             | Scheme              | `EXPO_PUBLIC_APP_ENV` |
| ----------------------- | ---------------------- | ------------------------------- | ------------------- | --------------------- |
| `development` (default) | `RN Starter (Dev)`     | `com.example.rnstarter.dev`     | `rnstarter-dev`     | `development`         |
| `preview`               | `RN Starter (Preview)` | `com.example.rnstarter.preview` | `rnstarter-preview` | `preview`             |
| `production`            | `RN Starter`           | `com.example.rnstarter`         | `rnstarter`         | `production`          |

- `npm start` runs the development variant; `npm run start:preview` and
  `npm run start:production` run the others.
- `npm run prebuild:preview` (and the other variants) generates the native
  projects for that variant.
- To build a preview or production app on your machine, run
  `npm run build:preview:android` or `npm run build:preview:ios` (and
  `build:production:*`) after its prebuild. They set `APP_VARIANT` and
  `EXPO_PUBLIC_APP_ENV` for the whole build: the native build evaluates
  `app.config.ts` again (for `expo-constants`) and bundles the JavaScript, so
  a plain `npx expo run:*`, Xcode, or Gradle build without them embeds the
  development config and runs as `development` (debug) or `production`
  (release). Building from Xcode or Android Studio, start it from a shell
  that exports both variables.
- `eas.json` has matching `development`, `preview`, and `production` build
  profiles for [EAS Build](https://docs.expo.dev/build/introduction/), which
  needs your own Expo account; nothing else in the project does.
- Outside development, backend URLs must be `https`. `.env` is not committed,
  so set the variables in the build profile's `env` or with `eas env:create`.

## Icons and splash screen

All four images are placeholders. Replace the files, keeping their names and
sizes:

| File                       | Size                   | Used for                                                                  |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `assets/icon.png`          | 1024×1024, opaque      | iOS icon and the default elsewhere (`icon`)                               |
| `assets/adaptive-icon.png` | 1024×1024, transparent | Android adaptive icon foreground; keep the artwork inside the center ~66% |
| `assets/splash-icon.png`   | 1024×1024, transparent | Splash image, 200 pt wide, on `APP.splashBackground` (light and dark)     |
| `assets/favicon.png`       | 48×48                  | Web favicon                                                               |

The splash screen and icons are part of the native build: Expo Go shows its
own, so check them in a build (`npm run prebuild:preview`, then build). The
native splash stays up until the stored session has been read
(`app/_layout.tsx`). See
[Expo: splash screen and app icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

## Permissions

The app asks for no permission it doesn't use. `app.config.ts` removes the
Android permissions that Expo's template and libraries add by default
(`UNUSED_ANDROID_PERMISSIONS`: vibration and shared storage) through
`android.blockedPermissions`; preview and production builds also drop
`SYSTEM_ALERT_WINDOW`, which only development tools use. On iOS,
`expo-secure-store` is configured without a Face ID prompt
(`faceIDPermission: false`), since tokens are stored without biometrics.

When you add a feature that needs one of these, remove it from the list (or
set `faceIDPermission` to the text iOS shows), and add any new permission
with its plugin's options or `ios.infoPlist`. See
[Expo: permissions](https://docs.expo.dev/guides/permissions/).
