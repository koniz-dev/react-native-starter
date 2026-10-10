# Issue 44 verification — a previous install's Keychain token

Verified on 2026-10-10 on `main` at
[`1bca845`](https://github.com/koniz-dev/react-native-starter/commit/1bca845).

## Change

- **`shared/session/session.ts`.** New `clearSessionFromPreviousInstall()`.
  It reads the install marker, `STORAGE_KEYS.INSTALL_MARKER`, a new key in
  `shared/storage/storage.ts`, from AsyncStorage, which iOS deletes with the
  app. If there is no marker and no stored user, it clears the stored session
  (the token in the Keychain, and the user). Then it writes the marker.
  - A stored user without a marker means an install updated from a version
    without the marker. That install keeps its session, so updating doesn't
    sign anyone out.
- **`shared/session/SessionProvider.tsx`.** `readStoredSession()` calls the
  new function before it reads the token. A storage failure still counts as
  signed out.
- **`jest.setup.ts`.** Writes the marker after clearing AsyncStorage before
  each test, so tests run as an app that has launched before and existing
  tests that seed only a token are unchanged. `tokenStore.test.tsx` now
  expects that key in AsyncStorage.
- **Docs.**
  - `docs/api-and-storage.md` has a new "After a reinstall" section. It also
    notes that adapter-owned secure items, such as a refresh token, survive a
    reinstall but are never used.
  - `STORAGE_KEYS` lists `INSTALL_MARKER`.
  - `docs/testing.md` documents the marker and how to test a first launch.

## Acceptance criteria

| #   | Criterion                                                                                                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | On the first launch after an install (no marker), any token left in secure storage is deleted before the session is restored, so a fresh install starts signed out | The code above. `sessionRoutes.test.tsx`, "clears a token left by a previous install and starts signed out": with no marker and a token in secure storage, Home shows "Not signed in", the token is deleted, and the marker is written                                                                                                                                                                                                                                                                                                                                                                                                    | PASS   |
| 2   | Later launches keep the session (sign in, relaunch: still signed in)                                                                                               | "restores the session on later launches (the marker is set)", and "keeps an existing session from before the marker existed" (an updated install). On the simulator: [after-2](uat/screenshots/after-2-relaunch-still-signed-in.png)                                                                                                                                                                                                                                                                                                                                                                                                      | PASS   |
| 3   | Jest: a token with no marker is cleared and the app starts signed out; with the marker it is restored                                                              | The three tests above, plus every existing test that seeds a token: those now run with the marker and still restore. Without the `SessionProvider` call, the three new tests fail and the app shows "Signed in as your account", which is the reported bug ([tests-without-fix.log](tests-without-fix.log))                                                                                                                                                                                                                                                                                                                               | PASS   |
| 4   | iOS Simulator: sign in, delete Expo Go's app data or reinstall (keeping the Keychain), launch: signed out; screenshots                                             | iPhone 16 Plus simulator, Expo Go, demo backends, flow [reinstall-keeps-keychain.yaml](uat/flows/reinstall-keeps-keychain.yaml): sign in, relaunch, then Maestro `clearState` (deletes the app data and keeps the Keychain, as a reinstall does), then relaunch. **With the fix** ([log](uat/after-fix-maestro.log)), the flow passes: signed in, still signed in after the relaunch, and "Not signed in" after the data was deleted. **Without it** ([log](uat/before-fix-maestro.log)), the same flow fails: Home shows "Signed in as your account" with the old Keychain token. [Screenshots](uat/screenshots-sheet.png), each checked | PASS   |
| 5   | Docs (`docs/api-and-storage.md`) mention the behavior                                                                                                              | [API and Storage → After a reinstall](https://github.com/koniz-dev/react-native-starter/blob/1bca845/docs/api-and-storage.md#after-a-reinstall)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | PASS   |
| 6   | Gates pass locally and in CI                                                                                                                                       | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log) (254 tests). CI run 38067749968 on `1bca845`: success ([log](github-actions-ci-38067749968.log))                                                                                                                                                                                                                                                                                                                                                                          | PASS   |

## Notes

- **A real reinstall** was not done. Expo Go hosts the app, and deleting
  Expo Go would remove the runtime too. Maestro's `clearState` deletes Expo
  Go's data container and keeps the Keychain, which is the state after a
  reinstall that the issue describes. A native build would behave the same.
- **Android** is unchanged in practice. Its Keystore data goes with the app,
  so a fresh install has no token, and the check only writes the marker.
- **The UAT log** contains the public demo credentials (`emilys` /
  `emilyspass`), which are documented in the starter. The log contains no
  tokens.
