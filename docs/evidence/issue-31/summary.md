# Issue 31 verification — session provider and protected routes

Verified on 2026-10-07.

## Change

- `providers/SessionProvider.tsx`: one session state for the app
  (`loading` / `signedOut` / `signedIn` with user), `signIn`, `signOut`,
  `refreshUser`, and `useSession()`. It restores the stored session on cold
  start (a later sign-in/out/expiry wins over a slow restore) and follows the
  session-expired event from `services/session.ts`.
- `app/_layout.tsx`: mounts the provider; `RootNavigator` keeps the splash
  screen up while the session loads, then guards `(auth)` with
  `Stack.Protected guard={!signedIn}` and `(app)` with `guard={signedIn}`.
- `app/(app)/`: protected group with a `profile` screen. Its layout adds a
  header back button for the group's first screen (the nested stack would
  otherwise have none; found during the device run). Profile reloads the user
  with `GET /auth/me` through an authenticated client
  (`authService.fetchProfile()`), which is where an expired token surfaces.
- Login signs in through `useSession().signIn` with no navigation code; Home
  reads `useSession()` and the `useFocusEffect` re-read is gone.
  `hooks/useAuthSession.ts` is removed.
- Docs: `docs/how-to.md` (Authentication), `hooks/README.md`,
  `docs/api-and-storage.md`, README.

## Acceptance criteria

| #   | Criterion                                                                                                                                         | Evidence                                                                                                                                                                                                                          | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Root `SessionProvider` owns `loading`/`signedIn`/`signedOut` and user, exposes `signIn`, `signOut`, `session`; subscribes to session-expired      | `providers/SessionProvider.tsx`, `app/_layout.tsx`; test "a session-expired event (API 401) signs out and leaves the protected group"                                                                                             | PASS   |
| 2   | Login signs in through the provider; Home and other consumers update without focus polling                                                        | `app/(auth)/login.tsx`, `app/(tabs)/index.tsx` (no `useFocusEffect`); test "signing in updates every consumer and leaves the login screen"; Login and Home tests in [05](05-session-tests.log)                                    | PASS   |
| 3   | Documented, working protected group with at least one protected screen                                                                            | `app/(app)/_layout.tsx`, `app/(app)/profile.tsx`; `docs/how-to.md` "Add a protected screen"; device runs below                                                                                                                    | PASS   |
| 4   | Jest: sign-in updates all consumers; sign-out and expiry return to signed-out and leave the group; cold-start restore                             | [05-session-tests.log](05-session-tests.log): 9 route tests in `__tests__/navigation/sessionRoutes.test.tsx` plus Login/Home (22 tests). Removing the guards fails 3 of them; removing the loading wait fails the cold-start test | PASS   |
| 5   | Native UAT (iOS simulator, Android emulator, Expo Go): sign in, relaunch, protected screen reachable; simulate expiry → redirected and signed out | Tables below                                                                                                                                                                                                                      | PASS   |
| 6   | Gates pass locally and in CI                                                                                                                      | [01](01-lint.log) (0 errors; 6 existing `ThemedText.tsx` warnings, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (20 suites / 143 tests), [04](04-format-check.log); CI run in the closing comment               | PASS   |

## Device runs

The auth API pointed at a local server ([fake-auth-server.py](uat/fake-auth-server.py))
with Metro started as `EXPO_PUBLIC_AUTH_API_URL=http://localhost:9998`. It
accepts `emilys` / `emilyspass`, returns user "Emily Local", and answers
`GET /auth/me` with 401 `Invalid/Expired Token!` while a flag file says `401`
(the simulated expiry). Its log records only whether a Bearer token was sent
([fake-auth-server.log](uat/fake-auth-server.log)). Metro shows
`API GET /auth/me failed: unauthorized (401)` once per platform
([metro-http-warnings.log](uat/metro-http-warnings.log)).

### iOS 18.6 simulator (iPhone 16 Pro), Expo Go 57.0.9

| Step                                                         | Result                                                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed out, deep link `/--/profile`                          | Stays on Home, "Not signed in" ([screen](uat/ios-01-signedout-deeplink.png))                                                                                                          |
| Sign in with the software keyboard (XCUITest)                | `testReturnKeysAndSignInReachable` passed ([log](uat/xcuitest-login.log)); Home "Signed in as Emily Local" ([screen](uat/ios-02-signed-in.png), iOS's own Save Password sheet on top) |
| Terminate and relaunch Expo Go                               | Still signed in ([screen](uat/ios-03-relaunch.png))                                                                                                                                   |
| View profile                                                 | Profile with the server's user and a back chevron; server logs `GET /auth/me` with a Bearer token ([screen](uat/ios-04-profile.png))                                                  |
| Header back                                                  | Back on Home, signed in ([screen](uat/ios-05-back-home.png))                                                                                                                          |
| Server switched to 401, View profile                         | Within a second: Home, "Not signed in" ([screen](uat/ios-07-expired-home.png))                                                                                                        |
| Server back to normal, relaunch with deep link `/--/profile` | Home, "Not signed in": the token was cleared ([screen](uat/ios-08-relaunch-after-expiry.png))                                                                                         |

### Android emulator (API 37, Medium Phone), Expo Go, `adb reverse` for 8081 and 9998

| Step                                                         | Result                                                                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Signed out, deep link `/--/profile`                          | Home, "Not signed in" ([screen](uat/android-01-signedout-deeplink.png))                                                 |
| Sign in (keyboard Enter submits)                             | Home "Signed in as Emily Local" ([screen](uat/android-04-signed-in.png))                                                |
| Force-stop and relaunch                                      | Still signed in ([screen](uat/android-05-relaunch.png))                                                                 |
| View profile                                                 | Profile with the server's user and a back arrow ([screen](uat/android-06-profile.png))                                  |
| Hardware back                                                | Home, signed in ([screen](uat/android-07-hwback-home.png))                                                              |
| Server switched to 401, View profile                         | Home, "Not signed in"; the dev-only LogBox toast shows the client's warning ([screen](uat/android-08-expired-home.png)) |
| Server back to normal, relaunch with deep link `/--/profile` | Home, "Not signed in" ([screen](uat/android-09-relaunch-after-expiry.png))                                              |

## Found and fixed during the run

The profile header had no back button on either platform: `(app)` has its own
stack and profile is its first screen. The group layout now adds one for the
first screen only (`Appbar.BackAction`, chevron on iOS, arrow on Android);
test "the protected group has a back button to the screen that opened it".
