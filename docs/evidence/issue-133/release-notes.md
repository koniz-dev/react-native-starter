The annotated tag `v1.1.16` is on commit `14033fbaa048a34cfa4ee327b4c9017e24607fb0`. It was
verified on 2026-10-19 in [issue 133](https://github.com/koniz-dev/react-native-starter/issues/133)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-133)).

This release supersedes `v1.1.15`. It contains the fixes from an eighth deep audit
([#129](https://github.com/koniz-dev/react-native-starter/issues/129), [#130](https://github.com/koniz-dev/react-native-starter/issues/130), [#131](https://github.com/koniz-dev/react-native-starter/issues/131), [#132](https://github.com/koniz-dev/react-native-starter/issues/132)). A confirmation
audit of those fixes, with mutation testing of the new tests, found no HIGH or MEDIUM issue.

## Take this release if you started from an earlier one

- **Android request timeouts ([#129](https://github.com/koniz-dev/react-native-starter/issues/129)).** On Android a request that
  timed out was reported as `code: 'network'`, so users saw "No connection. Check
  your network and try again." on a working network, and code that checks
  `code === 'timeout'` never ran there. React Native reports OkHttp's call timeout
  as a network error; `toApiError` now recognizes it. To take this fix, copy
  `isAndroidCallTimeout` and its use in `shared/http/apiError.ts`.
- **If you ship OTA updates ([#131](https://github.com/koniz-dev/react-native-starter/issues/131)).** `eas update` doesn't read a
  build profile's `env` in `eas.json`. With `--environment` it uses that EAS
  environment's variables; without it, the local `.env` (choosing an environment
  at its prompt doesn't load it). Keep every `EXPO_PUBLIC_*` value and
  `APP_VARIANT` in EAS environment variables and always publish with
  `--environment`, or users who download the update get the configuration error
  screen or the wrong backends.
- **If you copied the push or OTA adapter from Plug In a Provider
  ([#131](https://github.com/koniz-dev/react-native-starter/issues/131)).** On the web the push adapter granted permission and then
  `getToken` rejected; it now reports push as `unsupported` and returns `null`
  there. The OTA adapter rejected in web development; it now reports
  `not-configured` on the web.

## What else changed

- **Showcase (demo) ([#130](https://github.com/koniz-dev/react-native-starter/issues/130)).** Pressing the same button twice left
  the snackbar hidden until the button was pressed twice more. Each press now
  remounts the Snackbar. `useAnnouncement` takes an optional repeat key, to read
  the same message out again on iOS.
- **init-project ([#132](https://github.com/koniz-dev/react-native-starter/issues/132)).**
  - Letters that Unicode doesn't split into a base letter and an accent are
    spelled out in the default slug: "Đọc Sách" gives `doc-sach` (before:
    `oc-sach`); also ß, Ø, Ł, Æ, Œ, Þ, ð and ı.
  - A name that starts with a digit gets a default scheme that starts with a
    letter ("2048 Game" gives `game`).
  - Kotlin keywords that Expo doesn't escape (`object`, `val`, `var`, `when`,
    `typealias`, `typeof`) are refused in the bundle ID.
- **Testing ([#130](https://github.com/koniz-dev/react-native-starter/issues/130), [#132](https://github.com/koniz-dev/react-native-starter/issues/132)).**
  - `renderWithProviders` uses the scheme `setColorScheme()` set, as the docs say.
  - The Todos "second press while loading" check can now fail.
  - Tests that the confirmation round showed could pass without the code they
    guard now fail without it.
  - E2E: flow 04 waits for a late iOS "Save Password?" sheet; `run.sh` resets
    the mock before each attempt and prints an Actions warning when the iOS
    flows needed their second attempt.
- **Docs ([#129](https://github.com/koniz-dev/react-native-starter/issues/129), [#131](https://github.com/koniz-dev/react-native-starter/issues/131)).** The timeout per platform; screen
  tracking fires when the route pattern changes; how the error reporter's user is
  set; the TanStack mapping's differences from `useFetch`; the Zustand persist
  adapter; the ESLint 9 deprecation warning; the EAS development profile; the
  layout trees.
- 708 tests (579 after `init-project --remove-demo --remove-recipes`).

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
  - node-forge, through `@expo/cli`;
  - braces, through Metro and Jest's `micromatch` (on this release npm reports
    only node-forge).

  They were reviewed in [issue 41](https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md)
  and are allowlisted until 2027-01-09 in `scripts/audit-allowlist.json`. The
  weekly Audit workflow fails when npm can apply a fix or when the review date
  passes.
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
- **Expo SDK 58 was released on 2026-09-29.** Under the support policy, the
  starter moves to SDK 58 within about 4 weeks of its release, so by about
  2026-10-27. Until the store's Expo Go moves to SDK 58, the QR-code path on a
  phone keeps working; after that, an iPhone can't open an SDK 57 project in
  Expo Go (simulators and emulators install the matching Expo Go).

## Maintenance mode

The starter is in maintenance mode. It accepts:

- security fixes;
- regressions;
- compatibility updates;
- docs corrections;
- narrow reliability fixes.

Only the latest Expo SDK is supported, and an upgrade follows within about 4
weeks of an Expo SDK release. To report a vulnerability, use the repository's
**Security** tab.
