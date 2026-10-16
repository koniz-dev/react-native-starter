# Issue #110: iOS E2E flakes, including an optional `openLink` that still fails on a simulator timeout

I found this while verifying #107–#109. Three iOS runs failed in the E2E harness,
each for a different reason; the app was not at fault in any of them. Each was fixed
in turn:

| Run (commit) | What failed | Cause | Fix |
|---|---|---|---|
| 38913766241 (cb74c16) | Flow 04, first step | `openLink` timed out (code 60) even though it was `optional: true`. See `1-openlink-timeout-maestro.log`. | 3abe4e8 opens the link only for Expo Go (`exp://`). |
| 38918689787 (3abe4e8) | Flow 03, sign-in | Maestro typed only `e` of the username. The app then correctly said "Invalid credentials". See `2-username-typed-e.png`. | aa9b4c0 adds `subflows/type-username.yaml`: it types, checks the field, and retries up to 2 times. 1f3c372 updates the `remove-demo` test, which pins the list of subflows. |
| 38924217578 (aa9b4c0) | Flow 03, after sign-in | The iOS "Save Password?" sheet appeared after the optional "Not Now" tap had already run. The app was signed in underneath, but the sheet hid it from Maestro. See `3-save-password-sheet.png`. | cb566e4 makes sign-in wait up to 5 s for the sheet on iOS, then dismiss it. |

## Why `optional` didn't help

In Maestro 2.11.0, `Orchestra.executeCommands` skips an optional command only when it
throws a `MaestroException` (`1-Orchestra-cli-2.11.0-L330-360.kt`). Every other
`Throwable`, such as the driver's `IllegalStateException` for code 60, becomes
`CommandFailed`. `retry` also catches only `MaestroException`
(`1-Orchestra-cli-2.11.0-L942-960.kt`), so no YAML wrapper can absorb that error.
`retry` does work for assertions, and the username subflow relies on that.

The native build has no expo-dev-client: a debug build loads its bundle from Metro
when `launchApp` starts it, so `rnstarter-dev://` only reopens the app. Expo Go still
needs the `exp://` link, and the flows still open it there.

## Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `open-app.yaml` opens the link only for an Expo Go URL, and its comment explains why `optional` doesn't help. | PASS | 3abe4e8 `.maestro/subflows/open-app.yaml`. |
| 2 | E2E iOS and E2E Android (`native-debug`) pass 7/7, and Expo Go flows still pass. | PASS | `e2e-ios-after.log`: two iOS runs on cb566e4, 38929767737 and 38929783717, both 7/7 plus dark mode. `e2e-aa9b4c0.log`: Android native-debug 38924222252, 7/7. `e2e-3abe4e8.log`: Android native-debug 38918696349 and Android Expo Go 38918701713, both 7/7; Expo Go takes the `exp://` branch. iOS Expo Go was not run locally (see below). |
| 3 | Gates and CI are green. | PASS | `gates.log`: 582/582. CI and Audit pass on cb566e4. |

## Not verified

- **iOS Expo Go locally:** not run. The scratch Maestro and JDK had been deleted, and
  the change only adds a condition that is true for `exp://`, which Android Expo Go
  covers.
- **The Android path of `sign-in.yaml` after cb566e4:** not re-run on Android. The new
  wait is inside `when: platform: iOS`; the last Android runs were on aa9b4c0.
- **CI on aa9b4c0:** red. It was pushed with the `remove-demo` test still pinning the
  old subflow list, and 1f3c372 fixed it. Before pushing, run the full gates, not a
  subset.
