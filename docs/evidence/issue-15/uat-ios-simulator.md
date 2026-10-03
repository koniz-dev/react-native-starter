# Issue 15 UAT — iOS simulator interactions (2026-10-03)

Environment: iPhone 16 Pro simulator, iOS 18.6, Xcode 16.4, Expo Go 57.0.9,
Expo SDK 57 app served by `npx expo start --tunnel`. The Expo Go Developer
menu onboarding was skipped with
`xcrun simctl spawn booted defaults write host.exp.Exponent EXDevMenuIsOnboardingFinished -bool YES`,
and taps were driven through macOS Accessibility events on the Simulator
window.

Not covered: Android (no SDK, emulator, or `adb` on this host) and a native
iOS development build (still needs Xcode 26.4+, see
[ios-xcode-16.4-build-failure.md](ios-xcode-16.4-build-failure.md)).

## Results

| Check                          | Observation                                                                                                                                                                                                           | Evidence                                                                                      | Result                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| Launch, bundle, initial render | Home renders below the Dynamic Island with the tab bar above the home indicator.                                                                                                                                      | [01](uat-ios/01-home-light.png)                                                               | PASS                                  |
| Tab navigation                 | Explore tab opens and lists 10 todos from JSONPlaceholder.                                                                                                                                                            | [02](uat-ios/02-explore-tab-api-success.png)                                                  | PASS                                  |
| Sign in / log out / relaunch   | Covered in [issue 11 UAT](../issue-11/uat-ios-simulator.md): login, persistence across relaunch, and logout behave correctly; logout has no shipped UI.                                                               | issue-11                                                                                      | PASS (storage); see issue 11 findings |
| Light / dark theme             | `xcrun simctl ui booted appearance dark`: screens switch to dark, but the **tab bar stays light** and the **active tab's icon and label become invisible** (light tint on a light background).                        | [03](uat-ios/03-dark-explore-tabbar-defect.png), [04](uat-ios/04-dark-home-tabbar-defect.png) | **FAIL**                              |
| API failure                    | `EXPO_PUBLIC_API_URL` pointed at a local server returning HTTP 500: Explore shows the error card "Request failed with status code 500".                                                                               | [05](uat-ios/05-api-failure.png)                                                              | PASS                                  |
| Retry                          | Server switched to 200, Retry tapped: 10 todos load. The server logged two requests per load (minor, likely the dev double-invoke).                                                                                   | [06](uat-ios/06-api-retry-recovered.png)                                                      | PASS                                  |
| Keyboard                       | Typing through the hardware keyboard works. With the software keyboard, the **Sign In button is covered**; the screen has no `KeyboardAvoidingView`, keyboard insets, or `onSubmitEditing`, so Return doesn't submit. | [07](uat-ios/07-software-keyboard-covers-sign-in.png)                                         | **FAIL**                              |
| Safe areas / system bars       | Content clears the Dynamic Island and the home indicator in portrait, in both themes. The status bar text follows the theme.                                                                                          | 01–07                                                                                         | PASS (portrait only)                  |

## Root cause notes

- Tab bar: `app/(tabs)/_layout.tsx` sets only `tabBarActiveTintColor:
Colors[colorScheme].tint`. The app wraps navigation in Paper's provider but
  not in a React Navigation `ThemeProvider`, and sets no `tabBarStyle`, so the
  tab bar keeps the default light navigation theme while the tint switches to
  the dark-mode tint.
- Keyboard: `app/(auth)/login.tsx` uses a plain `ScrollView`
  (`keyboardShouldPersistTaps="handled"`) without keyboard avoidance.

## Verdict

iOS (Expo Go): 2 failures (dark-mode tab bar, keyboard covers Sign In); the
other checks pass. Android: NOT VERIFIED. Criterion 3 (audit) remains open
under #16. The issue cannot close.
