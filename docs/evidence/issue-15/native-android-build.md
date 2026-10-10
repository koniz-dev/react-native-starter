# Issue 15 — native Android build and run (2026-10-04)

Source: commit 12d723e, copied to a temporary directory so prebuild output
never touched the managed project's worktree.

## Build

`npx expo prebuild --platform android --no-install` finished, with one
warning: `userInterfaceStyle: Install expo-system-ui in your project to enable
this feature` (tracked in #24). Then
`./gradlew assembleDebug -PreactNativeArchitectures=x86_64` (Gradle 9.3.1,
compileSdk/targetSdk 36, minSdk 24, NDK 27.1.12297006, Kotlin 2.1.20).

- With Android Studio's bundled OpenJDK 25.0.3 the build **fails** in the
  `configureCMakeDebug` tasks of `react-native-screens` and
  `expo-modules-core` ("A restricted method in java.lang.System has been
  called").
- With Temurin JDK 17.0.20.1 the build **succeeds** (`BUILD SUCCESSFUL`,
  `app-debug.apk`, 63,671,310 bytes). The JDK 17 requirement is now in
  `docs/getting-started.md`.

Log: [native-android/gradle-build.log](native-android/gradle-build.log).

## Run on Android 17 / API 37 emulator (`UAT_Root_API_37`)

The debug APK was installed with `adb install` and loaded its bundle from
Metro (`Loading from 10.0.2.2:8081`, `Running "main" … "fabric":true`).

| Check              | Observation                                                                                                                                                         | Evidence                                                          | Result                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------- |
| Install and launch | Home renders; no Expo Go UI.                                                                                                                                        | [01](native-android/01-native-home-light-statusbar-invisible.png) | PASS                       |
| Tabs and API       | Explore lists 10 todos from JSONPlaceholder.                                                                                                                        | [02](native-android/02-native-explore-api.png)                    | PASS                       |
| Sign in            | `emilys` / `emilyspass` signs in and returns to the tabs; the app's `shared_prefs/SecureStore.xml` is created.                                                      | [03](native-android/03-native-after-login.png)                    | PASS                       |
| Dark mode          | Screens switch to dark; the tab bar keeps the light style (#20).                                                                                                    | [04](native-android/04-native-dark-mode.png)                      | Known defect #20           |
| Relaunch           | Force-stop (process gone), relaunch: Home renders, no `FATAL`/`AndroidRuntime` lines in logcat.                                                                     | [05](native-android/05-native-relaunch-no-crash.png)              | PASS                       |
| Status bar         | In light mode the status bar icons are white on white (`mLastAppearance=LIGHT_NAVIGATION_BARS`, no `LIGHT_STATUS_BARS`); readable in dark mode. Expo Go masks this. | [01](native-android/01-native-home-light-statusbar-invisible.png) | **Defect, tracked in #24** |

## Verdict

A native Android build compiles with JDK 17 and starts, navigates, signs in,
and relaunches without a crash. That satisfies the Android build/start part
of criterion 4. Defects found (#20, #24) are tracked as their own issues.
