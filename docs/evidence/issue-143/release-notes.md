The annotated tag `v1.1.17` is on commit `1ecec296f761ff98b0be8f8a5b61fbb09bd79f8b`. It was
verified on 2026-10-25 in [issue 143](https://github.com/koniz-dev/react-native-starter/issues/143)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-143)).

This release supersedes `v1.1.16`. It is a security release: it contains only the zod
fix from [#142](https://github.com/koniz-dev/react-native-starter/issues/142). The Expo SDK 58 upgrade
([#134](https://github.com/koniz-dev/react-native-starter/issues/134)) will be the next release.

## Take this release if you started from an earlier one

- **zod GHSA-mrhx-c7xc-m3w5 (high, [#142](https://github.com/koniz-dev/react-native-starter/issues/142)).** zod through 4.6.5
  records an issue for every failing array element with no limit, so validating a
  huge array of invalid items can exhaust memory. The app parses backend arrays
  with `z.array` (the demo Todos, and the pattern Connect Your Backend teaches), so
  a backend response like that could crash the app. To take this fix:
  - set `"zod": "^4.6.7"` in `package.json` and run `npm install`; check with
    `npm ls zod` that the app's zod is 4.6.7 or later;
  - in `scripts/audit-allowlist.json`, remove the `braces` entry (npm no longer
    reports it) and add the zod entry from this release: npm still reports the
    advisory for the zod 3 inside `@expo/cli`, which only the dev server uses and
    which has no fix. Re-review it for your project.

## What else changed

Nothing else. `package.json`, `package-lock.json` and `scripts/audit-allowlist.json`
are the only files changed since `v1.1.16`. 708 tests (579 after
`init-project --remove-demo --remove-recipes`).

## Supported

| Item     | Supported                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Expo SDK | 57 (expo 57.0.30, React Native 0.86.3, React 19.2.3, Expo Router 57.0.28)                                       |
| Node     | 24.21.0 (`.nvmrc`, what CI uses); 24.3+ or 22.13+ also work (`engines`, not 23); npm with the committed `package-lock.json` |
| Android  | Expo Go, and a native debug build of the development variant (`npm run prebuild:development`, `assembleDebug`); release builds of a variant with `npm run build:<variant>:android` (not part of the verification) |
| iOS      | Expo Go on the iOS Simulator, and a native debug build of the development variant (`npm run prebuild:development`, `xcodebuild`; Xcode 26.4+); release builds are not part of the verification |
| Web      | Static export (`npm run export:web`, production variant)                                                        |

It was verified on:

- **GitHub Actions, Android:** an API 34 `google_apis` x86_64 emulator on
  `ubuntu-24.04`, in Expo Go 57.0.9 and in the native debug build. 7 flows plus
  dark mode in each.
- **GitHub Actions, iOS:** the native debug build of the development variant on
  `macos-26-arm64` (Xcode 26.6, iOS 26.5 SDK), on the iPhone 17 simulator the
  workflow picks on the newest runtime. 7 flows plus dark mode. Every flow passed
  on the first attempt; the retry wasn't needed.
- **iOS Expo Go:** an iPhone 16 Plus simulator on iOS 18.6, Expo Go 57.0.9
  (Xcode 16.4, macOS 15.8.1). 7 flows plus dark mode.
- **Web:** headless Google Chrome, on the production export.

All flows run against the local e2e mock.

## Non-goals

These are unchanged since v1.0.0:

- **A production backend.** DummyJSON and JSONPlaceholder are demo
  endpoints for you to replace.
- **App-store or EAS builds and submission.**
- **Real third-party providers.** Analytics, crash reporting, push,
  feature-flag, and OTA providers are out of scope; the starter provides only
  the seams and their defaults.
- **A state-management library.** The starter has recipes only;
  `init-project` removes them unless you pass `--keep-recipes`.
- **Landscape layouts and testing on physical devices.**

## Known limitations

- **iOS native is verified only on GitHub Actions** (`macos-26`): the
  maintainers' machine has Xcode 16.4, and SDK 57 needs 26.4+.
  - A run takes about 40 minutes.
  - The iOS simulator there is flaky. #110 and #127 work around it with retries
    of link opens, keystrokes, the first tap after a launch, and, once, the whole
    run. A flow that keeps needing the retry is worth a look: read the first
    attempt's output.
  - In one of the #127 failures, a tap reached the app but no press followed.
    Its cause is not known.
  - The workflow tests only the branch or tag it runs on (#112). To test an
    older commit, run it on a branch at that commit that has the workflow file.
- **Web keeps the token in memory**, so reloading the page signs you out. This
  is documented in API and Storage.
- **iOS's request timeout is an idle one:** a response that keeps trickling in
  doesn't time out there, while Android and the web limit the whole request
  (API and Storage).
- **Authenticated endpoints should not redirect.** On iOS a redirect drops the
  token (and on every platform a cross-origin one does), so such a 401 keeps
  the session and only fails the request. Redirects between an IDN host and
  another host are not fully recognized (#123). Request the final URL.
- **Two allowlisted high advisories** are in build-time dependencies only:
  - node-forge, through `@expo/cli`
    ([issue 41](https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md);
    allowlisted until 2027-01-09);
  - zod 3, through `@expo/cli`'s dev server
    ([issue 142](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-142);
    allowlisted until 2027-01-25). The app's own zod is patched.

  Both are in `scripts/audit-allowlist.json`. The weekly Audit workflow fails
  when npm can apply a fix or when a review date passes.
- **Three moderate advisories** were reviewed in
  [issue 89](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-89):
  - decode-uri-component, through expo-router;
  - uuid, through the prebuild tooling;
  - sprintf-js, in Jest coverage.

  The app never reaches the vulnerable code. If your own code calls
  `query-string`'s `parse` on outside input, you are exposed.
- **ESLint 9 is deprecated on npm.** `eslint-plugin-react` and
  `eslint-plugin-react-native` don't accept ESLint 10 yet. The upgrade will
  follow when they do.
- **Expo Go draws its own status bar on Android**, so in light mode the status
  bar is Expo Go's black strip. The native debug build shows the app's own
  status bar.
- **Maestro writes `MAESTRO_*` values into `e2e-results/`.** For signed-in
  flows, use a test account (#55).
- **After `--remove-demo`, few e2e flows remain:** cold start, Back from Login,
  and dark mode. The sign-in subflows stay, so your own signed-in flows need
  only a test account (see Testing, "Writing a flow").
- **On Android in Expo Go, an upload sent the moment the image picker closes
  can fail once** with a network error; a second try succeeds. The root cause
  is not known (#97). If you upload right after picking, retry once on
  `network`.
- **A signed-out deep link to a protected screen lands on Home** (see the guard
  in Conventions, Navigation). Signing in stays on Home instead of opening the
  screen the link asked for.
- **Expo SDK 58 was released on 2026-09-29.** The upgrade is ready on the
  `sdk-58` branch ([#134](https://github.com/koniz-dev/react-native-starter/issues/134)). The starter moves to SDK 58 within about 1
  week of the store's Expo Go supporting it, so the QR-code path on a phone
  keeps working; on 2026-10-25 the store's Expo Go still runs SDK 57. If your
  Expo Go updates before the starter does, an iPhone can't open an SDK 57
  project in it (simulators and emulators install the matching Expo Go).

## Maintenance mode

The starter is in maintenance mode. It accepts:

- security fixes;
- regressions;
- compatibility updates;
- docs corrections;
- narrow reliability fixes.

The starter follows the Expo SDK that the store's Expo Go runs, and moves to a
new SDK within about 1 week of the store's Expo Go supporting it. To report a
vulnerability, use the repository's **Security** tab.


