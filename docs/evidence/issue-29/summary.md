# Issue 29 verification — app variants, build profiles, app identity

Verified on 2026-10-07.

## Change

- `app.json` replaced by `app.config.ts`. An `APP` block at the top holds the
  identity placeholders (name, slug, scheme, bundle ID `com.example.rnstarter`,
  version, splash and adaptive-icon colors). `APP_VARIANT`
  (`development` default, `preview`, `production`) adds per-variant suffixes:
  `RN Starter (Dev)` / `com.example.rnstarter.dev` / `rnstarter-dev`, and so on.
  `APP_BUILD_NUMBER` sets the iOS `buildNumber` and Android `versionCode`.
  Invalid values throw a clear error.
- `expo-splash-screen` installed and configured from `assets/splash-icon.png`
  with light (`#ffffff`) and dark (`#151718`) backgrounds. The splash image is
  now a distinct transparent placeholder (it was byte-identical to the
  adaptive icon foreground and nearly invisible on a dark background).
- `eas.json`: `development` (debug APK / iOS simulator), `preview` (internal
  APK), and `production` profiles, each setting `APP_VARIANT` and
  `EXPO_PUBLIC_APP_ENV`; `appVersionSource: local`.
- Scripts: `start:preview`, `start:production`, `prebuild:development|preview|production`,
  `config:print`.
- Docs: "Make It Yours" checklist and "Build variants" in
  `docs/getting-started.md`; `docs/splash-screen-and-app-icon.md` rewritten for
  the real paths and config; `app.json` references updated; README EAS note.
- Tests: `__tests__/config/appConfig.test.ts` (8 tests).

## Acceptance criteria

| #   | Criterion                                                                                                                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Result                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 1   | `app.config.ts` derives name, slug, scheme, IDs (per-variant suffixes), version/build numbers from `APP_VARIANT`; placeholders marked | [08-expo-config-development.json](08-expo-config-development.json), [preview](08-expo-config-preview.json), [production](08-expo-config-production.json); [07-app-config-tests.log](07-app-config-tests.log)                                                                                                                                                                                                                                                                   | PASS                              |
| 2   | `eas.json` with three profiles setting `APP_VARIANT`; nothing needs an account to commit or prebuild                                  | `eas.json` (valid JSON); `npx expo prebuild` and local Gradle builds below ran with no account. Note: `eas build --local` itself requires signing in to EAS CLI with the adopter's own Expo account, which is outside this repo's credential-free scope; documented in getting-started                                                                                                                                                                                         | PASS (prebuild/local Gradle path) |
| 3   | Splash (light and dark) and icons configured from `assets/`; placeholders distinct and documented                                     | Splash plugin in `app.config.ts`; generated `values-night` splash color ([09](09-android-variants.log)); [light splash](uat/android-01-preview-splash-light.png), [dark splash](uat/android-03-preview-splash-dark.png); asset md5s now all distinct; `docs/splash-screen-and-app-icon.md`                                                                                                                                                                                     | PASS                              |
| 4   | Scripts start/prebuild each variant without editing files                                                                             | `package.json` scripts; `APP_VARIANT=preview npx expo prebuild` used for the build below                                                                                                                                                                                                                                                                                                                                                                                       | PASS                              |
| 5   | `expo config` per variant shows expected name/IDs; two variants install side by side on the emulator                                  | Configs in row 1; [09-android-variants.log](09-android-variants.log): `aapt2` shows `com.example.rnstarter.dev` "RN Starter (Dev)" and `com.example.rnstarter.preview` "RN Starter (Preview)", both listed by `pm list packages` at once; [preview release running standalone](uat/android-02-preview-release-home-light.png) and [in dark mode](uat/android-04-preview-release-home-dark.png); [development debug build via Metro](uat/android-05-development-debug-home.png) | PASS                              |
| 6   | getting-started "make it yours" checklist, all config                                                                                 | `docs/getting-started.md` → "Make It Yours"                                                                                                                                                                                                                                                                                                                                                                                                                                    | PASS                              |
| 7   | Gates pass locally and in CI                                                                                                          | [01](01-lint.log) (0 errors; 6 existing `ThemedText.tsx` warnings, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (15 suites / 99 tests), [04](04-format-check.log), [05 expo-doctor 21/21](05-expo-doctor.log), [06 web export](06-web-export.log); CI run in the closing comment                                                                                                                                                                             | PASS                              |

## Build notes

Both APKs were built from a temporary copy of the working tree with
`expo prebuild` and Gradle (Temurin JDK 17): the development variant with
`assembleDebug` (loads JS from Metro) and the preview variant with
`assembleRelease` (JS embedded, runs without Metro). The release build ran
with `.env` from `.env.example`, so it used the demo backends.

The emulator was slow and its System UI stopped responding several times while
the host was short of memory (the iOS simulator was also running). The first
development-variant install left the app without a data directory
(`FileNotFoundException` when writing the dev bundle); uninstalling and
reinstalling fixed it, and quitting the iOS simulator stopped the Metro
connection aborts. None of these involved the app's code.
