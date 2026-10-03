# Issue 11 UAT — iOS simulator (2026-10-03)

Environment: iPhone 16 Pro simulator, iOS 18.6, Xcode 16.4, Expo Go 57.0.9,
Metro via `npx expo start --tunnel`. Taps were driven through macOS
Accessibility events on the Simulator window; storage was inspected directly
in the simulator's data directory.

Android was **not** verified: this host has no Android SDK, emulator, or `adb`.

## Temporary probe

The app has no UI that shows authentication state and no logout control, so
`isAuthenticated()`, `getCurrentUser()`, and `logout()` cannot be exercised by a
user. To drive them on-device, a temporary, **uncommitted** probe was added to
the Home screen ([temporary-probe.diff](uat-ios/temporary-probe.diff)): it
prints `authService.isAuthenticated()` / `getCurrentUser()` and calls
`authService.logout()`. It was reverted after the run.

## Steps and results

| Step                                 | Observation                                                                                                                                                                                                                                                                       | Evidence                                                                 | Result |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| Baseline                             | Keychain (`keychain-2-debug.db`, `genp`) holds 2 Expo Go items (rowid 96, 97, created 12:25:11).                                                                                                                                                                                  | —                                                                        | —      |
| Sign in with `emilys` / `emilyspass` | Login succeeds and returns to the tabs. A new Expo Go Keychain item (rowid 98) is created at 21:29:29. AsyncStorage `manifest.json` contains only `user_data` (`{"id":1,"email":"emily.johnson@x.dummyjson.com","name":"Emily Johnson"}`); no `auth_token` key or JWT is present. | [01](uat-ios/01-login-screen.png), [02](uat-ios/02-after-login-home.png) | PASS   |
| Terminate Expo Go and relaunch       | Probe shows `isAuthenticated=true user=Emily Johnson` in the new process.                                                                                                                                                                                                         | [03](uat-ios/03-relaunch-authenticated.png)                              | PASS   |
| `authService.logout()`               | Keychain item 98 is removed (only 96, 97 remain); AsyncStorage manifest is `{}`; probe shows `isAuthenticated=false user=null`.                                                                                                                                                   | [04](uat-ios/04-after-logout.png)                                        | PASS   |
| Terminate and relaunch after logout  | Probe still shows `isAuthenticated=false user=null`.                                                                                                                                                                                                                              | [05](uat-ios/05-relaunch-after-logout.png)                               | PASS   |

Keychain account/service attributes are stored hashed in the simulator
database, so the item is identified by its creation at login time and its
removal at logout, not by reading the key name.

## Findings

1. **No user-reachable logout or signed-in state.** The authentication demo
   can only sign in; nothing in the shipped UI reads the session or deletes
   the token. Criterion 1's read and delete paths were verifiable only with
   the probe above.
2. **The demo backend also sets token cookies.** After login, Expo Go's
   `Library/Cookies/host.exp.Exponent.binarycookies` contains dummyjson
   `accessToken` and `refreshToken` cookies, written by the native HTTP cookie
   store outside SecureStore. `logout()` does not clear them. This comes from
   the dummyjson response, not from `authService`, but it means a second copy
   of the credential lives in unprotected storage.

## Verdict

iOS: criterion 1 PASS at the storage level (with probe). Android: NOT
VERIFIED. The issue stays in `status:needs-uat` until Android is checked and
the findings above are decided.
