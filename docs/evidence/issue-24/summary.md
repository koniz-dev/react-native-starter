# Issue 24 verification — status bar icons follow the theme

Verified on 2026-10-04.

## Change

- Installed `expo-status-bar` (~57.0.1) and `expo-system-ui` (~57.0.4) with
  `npx expo install … -- --legacy-peer-deps`; `expo-status-bar`'s config
  plugin was added to `app.json`.
- `app/_layout.tsx` renders `<StatusBar style={theme.dark ? 'light' : 'dark'} />`
  from the active Paper theme.
- `docs/system-bars.md` describes what the starter ships and why native builds
  need it.

## Acceptance criteria

| #   | Criterion                                                                                                                               | Evidence                                                                                                                                                                                                                                                                                                                                                                                                      | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Native Android: dark status bar icons in light mode, light icons in dark mode                                                           | [android-native-01 (light)](uat/android-native-01-light-dark-icons.png): dark clock and icons; [android-native-02 (dark)](uat/android-native-02-dark-light-icons.png): light icons.                                                                                                                                                                                                                           | PASS   |
| 2   | Prebuild no longer warns that `userInterfaceStyle` needs `expo-system-ui`                                                               | [native-android-build.log](native-android-build.log): prebuild output has no warning (0 matches for `userInterfaceStyle\|warn`); before this change it printed the warning ([issue-15 native-android-build.md](../issue-15/native-android-build.md)).                                                                                                                                                         | PASS   |
| 3   | Jest + RNTL: root layout renders the theme-following status bar                                                                         | [05-status-bar-tests.log](05-status-bar-tests.log): `renderRouter('./app')` in light and dark asserts `StatusBar.style` (`dark`/`light`) and the native `barStyle` (`dark-content`/`light-content`). Both fail without the change (checked locally).                                                                                                                                                          | PASS   |
| 4   | Native Android build on the emulator: light/dark icons and `LIGHT_STATUS_BARS` in light mode; Expo Go on iOS and Android still readable | Native debug build (Gradle `BUILD SUCCESSFUL`, JDK 17) on Android 17 / API 37: `mLastAppearance=LIGHT_STATUS_BARS LIGHT_NAVIGATION_BARS` in light mode, `LIGHT_NAVIGATION_BARS` only in dark mode ([log](native-android-build.log)). Expo Go: [Android light](uat/android-expo-go-light.png), [iOS 18.6 light](uat/ios-expo-go-light.png), [iOS dark](uat/ios-expo-go-dark.png): status bar readable in each. | PASS   |
| 5   | lint, type-check, test:ci, format:check                                                                                                 | [01](01-lint.log) (0 errors; the 6 warnings are the existing ones in `components/ThemedText.tsx`), [02](02-type-check.log), [03](03-test-ci.log) (12 suites / 63 tests), [04](04-format-check.log)                                                                                                                                                                                                            | PASS   |

The "Cannot connect to Expo CLI" toast in the Android Expo Go screenshot is
Expo Go's dev-tools connection notice: Expo Go was opened right after the
native debug build had been connected to the same Metro server. The app
rendered normally.
