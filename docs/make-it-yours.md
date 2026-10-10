# Make It Yours

Everything to change to turn the starter into your app. Most of it is
configuration; the code changes are an auth adapter and your own features.

<!-- @init remove-block-start -->

**Start with `npm run init-project`** ([Getting Started](getting-started.md#make-it-your-project-first)):
it sets the app name, slug, scheme, bundle ID, version, `package.json` name,
README title, and LICENSE holder, optionally removes the demo, and deletes
the starter's maintainer files. The checklist below is the reference for
what it changes (the first row) and what is left for you.

<!-- @init remove-block-end -->

## Checklist

| What                                                          | Where                                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| App name, slug, URL scheme, bundle / package ID, version      | the `APP` block at the top of `app.config.ts`                                            |
| Store build number (iOS `buildNumber`, Android `versionCode`) | `APP_BUILD_NUMBER` at build time (default `1`); raise it for every store upload          |
| Icon, Android adaptive icon, splash image, favicon            | replace the files in `assets/` ([below](#icons-and-splash-screen))                       |
| Splash and adaptive-icon background colors                    | `APP.splashBackground`, `APP.adaptiveIconBackground` in `app.config.ts`                  |
| Brand colors                                                  | `palette` in `shared/ui/theme.ts` ([UI and Theming](ui-and-theming.md))                  |
| Fonts                                                         | [UI and Theming](ui-and-theming.md#fonts)                                                |
| Backend URLs, timeout, log level                              | `EXPO_PUBLIC_*` variables ([Environment Variables](environment-variables.md))            |
| Sign-in against your backend                                  | an `AuthAdapter` ([Connect Your Backend](connect-your-backend.md))                       |
| Analytics, flags, push, OTA, crash reporting                  | adapters in `shared/integrations/setup.ts` ([Plug In a Provider](plug-in-a-provider.md)) |
| UI strings                                                    | `shared/i18n/en.ts` (and more locales via the i18n seam)                                 |
| Demo screens and the DummyJSON adapter                        | `npm run remove-demo` ([Remove the Demo](remove-demo.md))                                |
| Per-variant build settings and env for EAS Build              | `eas.json` build profiles                                                                |

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
  projects; build them with Xcode / Android Studio or
  `npx expo run:ios` / `npx expo run:android`.
- `eas.json` has matching `development`, `preview`, and `production` build
  profiles for [EAS Build](https://docs.expo.dev/build/introduction/), which
  needs your own Expo account. Nothing else in the starter does.
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

## After the checklist

- Run `npm run config:print` to see the resolved config for a variant.
- Run the gate: `npm run lint && npm run type-check && npm run test:ci`.
