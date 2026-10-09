# Issue 42 verification — Maestro end-to-end flows

Verified on 2026-10-10.

## Change

- **`.maestro/`.** Five ordered flows (`config.yaml`) and a dark-mode flow:
  - `01-cold-start`: a fresh state opens Home, signed out.
  - `02-tabs`: Home ⇄ Explore.
  - `03-auth-session`: sign in with the demo account, relaunch (still signed
    in), log out, relaunch (still signed out).
  - `04-login-keyboard`: the username's return key moves focus to the
    password, whose return key submits. If focus didn't move, the password
    would land in the username and sign-in would fail.
  - `05-explore-error-retry`: the local mock API returns 503, Explore shows
    the error, the API is switched back, and Retry loads the list.
  - `dark-mode`: Home and Explore screenshots with the device in dark mode.
  - Subflows open the app and sign in. Opening the app clears state when
    asked, reopens the link if Expo Go is still on its own home screen, and
    dismisses Expo Go's developer-menu introduction and system "isn't
    responding" dialogs.
- **Runner.** `npm run test:e2e:ios` / `test:e2e:android` run
  `scripts/e2e/run.sh`:
  - starts `scripts/e2e/mock-api.js` (GET `/todos`; POST `/__mode/ok|error`,
    called from the flow with `runScript`) and Metro with
    `EXPO_PUBLIC_API_URL` pointing at it;
  - builds the bundle first;
  - on Android, sets `adb reverse` and test-device settings (no animations,
    no background ANR dialogs);
  - runs the flows, then the dark-mode flow in dark mode, and stops its
    processes, including Metro's children.
  - Output goes to `e2e-results/<platform>/` (gitignored).
- **App.** The tab buttons have `testID`s (`tab-home`, `tab-explore`): on
  iOS the tab's accessibility label is "Explore, tab, 2 of 2", so text
  matching was unreliable.
- **CI.** `.github/workflows/e2e-android.yml` (manual dispatch) boots an API
  34 emulator, installs Expo Go for SDK 57 (URL from Expo's versions API) and
  the Maestro 2.11.0 release zip (sha256 checked), runs
  `npm run test:e2e:android`, and uploads the results.
- **Docs.** `docs/testing.md` "End-to-end flows (Maestro)" covers the flows,
  the commands, setup with no account, development builds, and slow
  emulators. `docs/getting-started.md` lists the scripts.
- **Installing Maestro here.** The owner chose the release download: the
  `cli-2.11.0` `maestro.zip` from GitHub, checked against the release's
  `checksums_sha256.txt` (`5384593c…283a`), unzipped into the session's
  scratch directory, and run with a JDK 17 unpacked from the Temurin package
  (`brew fetch`, `pkgutil --expand-full`). Nothing was installed
  system-wide. (`curl | bash` had been refused by this environment's policy
  in issue 19.)

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                       | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Flows: cold start → Home; tabs; sign in, relaunch (signed in), log out, relaunch (signed out); login return keys; Explore error + Retry (local mock); dark-mode tab bar / status bar screenshots | `.maestro/`; screenshots in [ios/](ios/) and [android-ci/](android-ci/) (signed in after relaunch, signed out after relaunch, password focused after the return key, 503 error, list after Retry, dark Home and Explore)                                                                                                                                                                                       | PASS   |
| 2   | `npm run test:e2e:android` / `test:e2e:ios` run the flows against Expo Go or a dev build; setup documented, no accounts                                                                          | `package.json`, `scripts/e2e/run.sh`; `docs/testing.md#end-to-end-flows-maestro` (`E2E_APP_ID` / `E2E_APP_URL` for a development build)                                                                                                                                                                                                                                                                        | PASS   |
| 3   | Flows pass on an Android emulator and an iOS simulator; output and screenshots saved                                                                                                             | iOS 18.6 simulator (local): [maestro.log](ios/maestro.log), [report.xml](ios/report.xml) `tests="5" failures="0"`, [dark](ios/maestro-dark.log). Android emulator (API 34, GitHub Actions run 37964912116): [maestro.log](android-ci/maestro.log), [report.xml](android-ci/report.xml) `tests="5" failures="0"`, [dark](android-ci/maestro-dark.log), [run log](android-ci/github-actions-run-37964912116.log) | PASS   |
| 4   | Optional: a CI job runs the Android flows on an emulator (manual dispatch allowed), documented                                                                                                   | `.github/workflows/e2e-android.yml`, documented in `docs/testing.md`; run 37964912116 green                                                                                                                                                                                                                                                                                                                    | PASS   |
| 5   | Gates pass locally and in CI                                                                                                                                                                     | [01 lint](01-lint.log), [02 tsc](02-type-check.log), [03 tests](03-test-ci.log) (205), [04 format](04-format-check.log), [05 docs](05-docs-check.log), [06 audit](06-audit-check.log); verify CI [07](07-github-actions-verify-37964900852.log)                                                                                                                                                                | PASS   |

## Notes

- **Android on this machine.** The local emulator (API 37) could not run the
  suite. With about 0.2 GB of 17 GB free, its system services crashed during
  runs ("Can't find service: settings/uimode"), and the launcher raised ANR
  dialogs. The local attempts are in [android-local/](android-local/). They
  led to the runner's bundle pre-build, the longer driver timeout, the ANR
  setting, and the Metro clean-up. The Android pass above is from the CI
  emulator.
- **First CI run** (37963811244): `01-cold-start` passed, `02-tabs` failed
  because the relaunched Expo Go was still on its home screen when the link
  arrived. The subflow now reopens the link (83fac30); the second run passed.
- **iOS** was last run before 83fac30. That change only adds the "reopen the
  link when Expo Go's home screen is visible" branch, which the iOS runs never
  reached.
- In the Android screenshots the status bar strip is black in light mode:
  Expo Go draws the status bar itself, and the starter's
  `StatusBar style` applies in native builds (documented in
  `docs/ui-and-theming.md`). The dark-mode screenshot shows light icons.
