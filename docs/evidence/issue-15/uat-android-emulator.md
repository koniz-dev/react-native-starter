# Issue 15 UAT — Android emulator interactions (2026-10-03)

Environment: Android Studio AVD `Medium_Phone_API_37.0` (sdk_gphone64_x86_64,
Android 17 / API 37), Expo Go 57.0.9 installed by `npx expo start --android`,
Metro on `localhost:8081` through `adb reverse` (the LAN URL Expo CLI opened
first failed with Expo Go's "Something went wrong" screen). Input was driven
with `adb shell input`.

## Results

| Check                          | Observation                                                                                                                                                                              | Evidence                                                                                              | Result               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------- |
| Install, launch, bundle        | `Android Bundled 15511ms index.ts (1571 modules)`; app renders.                                                                                                                          | [01](uat-android/01-cold-start-lands-on-login.png)                                                    | PASS                 |
| Initial route                  | Every cold start (`exp://localhost:8081` and `exp://localhost:8081/--/`) opens **Login**, not Home as on iOS, and Back exits to the launcher, so a signed-out user can't reach the tabs. | [01](uat-android/01-cold-start-lands-on-login.png)                                                    | **FAIL**             |
| Keyboard                       | The software keyboard covers the Sign In button; the ✓ key only dismisses the keyboard and doesn't submit.                                                                               | [02](uat-android/02-keyboard-covers-sign-in.png)                                                      | **FAIL**             |
| Sign in / relaunch / log out   | Covered in [issue 11 Android UAT](../issue-11/uat-android-emulator.md).                                                                                                                  | issue-11                                                                                              | PASS                 |
| Tab navigation and API success | `/explore` shows 10 todos from JSONPlaceholder; the Home tab opens.                                                                                                                      | [03](uat-android/03-explore-api-success.png)                                                          | PASS                 |
| Light / dark theme             | `adb shell cmd uimode night yes`: screens go dark, but the tab bar stays light and the active tab's icon and label disappear — same defect as iOS.                                       | [04](uat-android/04-dark-home-tabbar-defect.png), [05](uat-android/05-dark-explore-tabbar-defect.png) | **FAIL**             |
| API failure                    | `EXPO_PUBLIC_API_URL=http://localhost:9999` serving HTTP 500: error card "Request failed with status code 500".                                                                          | [06](uat-android/06-api-failure.png)                                                                  | PASS                 |
| Retry                          | Server switched to 200, Retry tapped: 10 todos load (one request per load on Android).                                                                                                   | [07](uat-android/07-api-retry-recovered.png)                                                          | PASS                 |
| Safe areas / system bars       | Content clears the status bar; the tab bar sits above the gesture bar; status bar icons follow the theme.                                                                                | 01–07                                                                                                 | PASS (portrait only) |

## Root cause notes

- Initial route: the app has no `app/index.tsx` and no `unstable_settings` /
  `initialRouteName`, so `/` is resolved between the `(auth)` and `(tabs)`
  groups without an explicit anchor. On Android this resolves to
  `(auth)/login`.
- Tab bar and keyboard: same causes as in
  [the iOS report](uat-ios-simulator.md#root-cause-notes).

## Verdict

Android (Expo Go): 3 failures (initial route, keyboard covers Sign In,
dark-mode tab bar); the other checks pass. A native Android development build
was not produced.
