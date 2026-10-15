# Issue 101: DocumentTitle threw on every screen in iOS native builds (fix 46c936b)

`expo-router/head` on iOS outside Expo Go is the native Head, which needs a
hosted `origin` and throws without one. `DocumentTitle` now renders nothing on
native (`DocumentTitle.tsx`) and uses `Head` on the web only
(`DocumentTitle.web.tsx`). The class of bug, iOS code paths never run (iOS
had only been verified in Expo Go), is covered by a new manual workflow,
`.github/workflows/e2e-ios.yml`: a native debug build of the development
variant on a macOS 26 runner (Xcode 26), with the Maestro flows.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Before: an iOS native debug build shows the error on Home | Run 38766039531 (input `ref=8f2895a`, before the fix): "Cold start" fails; `ios-native-ci/before/redbox-expo-head.png` is the red box "Expo Head: Add the handoff origin to the Expo Config…" from `DocumentTitle.tsx` (7:8) | PASS |
| 1b | After: the flows pass on an iOS native debug build | Run 38790493240 on b69ea1d (main): 7/7 flows + dark mode; screenshots in `ios-native-ci/after/` (Home, sign-in, relaunch, Profile, Explore error/retry, dark) | PASS |
| 2 | A jest test with the native module mocked fails before and passes after | `__tests__/app/nativeHead.test.tsx`: 5/5 fail before, pass after (`tests-before-after.txt`) | PASS |
| 3 | Web still titles every screen | Web smoke on the export (`web/`, script `web/web-smoke.js`): titles Home, Sign in, Component showcase checked; WEB SMOKE PASSED | PASS |
| 4 | Gates and CI | lint, type-check, format, docs:check, 579 tests; CI and Audit green on every commit | PASS |

Also verified: iOS Expo Go locally 7/7 + dark (`ios-expogo-local/`); Android
Expo Go 7/7 + dark on b69ea1d (run 38795139310) and native debug 7/7 + dark
on 74bae60 (run 38777584049). CI and Audit green on b69ea1d.

Getting the iOS workflow to run reliably took four more fixes, all in this
issue's commits:
- the Maestro XCTest driver can take over 3 minutes to start on a fresh
  runner simulator (`MAESTRO_DRIVER_STARTUP_TIMEOUT` 600 s; one run still
  timed out and passed on a rerun);
- an unsigned simulator build has no Keychain entitlement, so
  expo-secure-store failed (`ios-native-ci/after-unsigned/simulator-last.png`):
  the build is now signed ad hoc;
- `openLink` can time out (code 60) on a busy simulator while the app opens
  anyway: it is optional in `subflows/open-app.yaml`;
- `hideKeyboard` failed on iOS 26: optional in `subflows/sign-in.yaml`.
