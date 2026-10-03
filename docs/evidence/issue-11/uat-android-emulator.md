# Issue 11 UAT — Android emulator (2026-10-03)

Environment: Android Studio AVD `Medium_Phone_API_37.0` (sdk_gphone64_x86_64,
Android 17 / API 37, Google Play image), Expo Go 57.0.9 installed by Expo CLI,
Metro on `localhost:8081` through `adb reverse`. Taps and text entry were
driven with `adb shell input`.

The same temporary, uncommitted Home-screen probe as the iOS run was used
([temporary-probe.diff](uat-ios/temporary-probe.diff), byte-identical
changes) and reverted afterwards.

## Storage inspection limit

The Google Play system image has no root (`adbd cannot run as root in
production builds`) and Expo Go is not debuggable (`run-as: package not
debuggable`), so the Keystore-backed SecureStore entry and AsyncStorage could
not be read directly. Android results are behavioral, through the real
`authService` calls on the device.

## Steps and results

| Step                                                                      | Observation                                                                 | Evidence                                                                                      | Result |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| Sign in with `emilys` / `emilyspass`                                      | Login succeeds; Home probe shows `isAuthenticated=true user=Emily Johnson`. | [01](uat-android/01-cold-start-login.png), [02](uat-android/02-after-login-authenticated.png) | PASS   |
| `am force-stop host.exp.exponent` (process confirmed gone), then relaunch | Probe shows `isAuthenticated=true user=Emily Johnson`.                      | [03](uat-android/03-relaunch-authenticated.png)                                               | PASS   |
| `authService.logout()`                                                    | Probe shows `isAuthenticated=false user=null`.                              | [04](uat-android/04-after-logout.png)                                                         | PASS   |
| Force-stop and relaunch after logout                                      | Probe still shows `isAuthenticated=false user=null`.                        | [05](uat-android/05-relaunch-after-logout.png)                                                | PASS   |

## Findings

1. Same as iOS: no user-reachable logout or signed-in state; read/delete
   were exercised only through the probe.
2. On Android a cold start lands on the Login screen, not Home, and Back
   exits the app; Home was reached through the `/explore` deep link. Tracked
   in the [issue 15 Android UAT](../issue-15/uat-android-emulator.md).

## Verdict

Android: login, persistence across a process kill, and logout behave
correctly through `authService`. That the token sits in the Keystore is
supported by the code path (`expo-secure-store`) and the Jest evidence, not by
direct inspection on this image.
