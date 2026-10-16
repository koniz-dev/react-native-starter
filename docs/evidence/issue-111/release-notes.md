The annotated tag `v1.1.12` is on commit `cb566e4293f5b41f0021575e3491dbaab092c91f`. It was verified on
2026-10-17 in [issue 111](https://github.com/koniz-dev/react-native-starter/issues/111)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-111)).

This release contains the fixes from a fifth deep audit of every tracked file
([#101](https://github.com/koniz-dev/react-native-starter/issues/101)–[#105](https://github.com/koniz-dev/react-native-starter/issues/105))
and from a confirmation audit of those fixes
([#106](https://github.com/koniz-dev/react-native-starter/issues/106)–[#110](https://github.com/koniz-dev/react-native-starter/issues/110)).
No issue is open. For the first time, iOS native builds are verified, on GitHub
Actions.

## Take this release if you started from an earlier one

- **If you build for iOS natively, you need this fix ([#101](https://github.com/koniz-dev/react-native-starter/issues/101)).**
  - `DocumentTitle` used `expo-router/head`. In an iOS native build, that throws
    on every screen ("Expo Head: Add the handoff origin…"): a red error screen in
    development and an alert on every render in release.
  - Expo Go and Android are not affected, which is why it was not caught earlier.
  - Copy `shared/ui/DocumentTitle.tsx`, which renders nothing on native, and the
    new `shared/ui/DocumentTitle.web.tsx`, which sets the browser tab title.
- **Sessions ([#102](https://github.com/koniz-dev/react-native-starter/issues/102), [#108](https://github.com/koniz-dev/react-native-starter/issues/108)).**
  Copy `shared/session/` and `shared/http/apiError.ts`.
  - A slow sign-out that finishes after the session expired and someone signed
    in again no longer signs the new user out.
  - A sign-out still clears the stored session when the expiry's own clear
    failed, for example because the Keychain was locked.
  - Log out shows that it is busy.
  - A refresh rejected with 408 or 429 keeps the session, like a network error
    does; the new `isTransient()` decides this.
- **If you copied the adapter example from Connect Your Backend ([#102](https://github.com/koniz-dev/react-native-starter/issues/102), [#106](https://github.com/koniz-dev/react-native-starter/issues/106)), compare your `logout` with it.**
  Before this release, the example's `logout` had two problems:
  - It deleted the refresh token of a user who signed in again while the old
    sign-out was still running.
  - When a refresh rotated the token during sign-out, it kept the rotated token
    on the device, and that token stayed valid on the backend.

  The example now counts sign-ins and revokes a rotated token.
- **Data loading ([#103](https://github.com/koniz-dev/react-native-starter/issues/103)).**
  - `useFetch` no longer shows the previous `deps`' data while new data loads.
  - The splash screen hides when a startup error reaches the error boundary.
    Before, the splash covered the error screen.

## What else changed

- **Config ([#102](https://github.com/koniz-dev/react-native-starter/issues/102)).** `env.ts` rejects URLs that the
  token-safety check couldn't read, such as `https://@` and `https://:443`.
- **Login ([#102](https://github.com/koniz-dev/react-native-starter/issues/102)).** Login trims the username but
  sends the password as typed.
- **Logger ([#103](https://github.com/koniz-dev/react-native-starter/issues/103), [#109](https://github.com/koniz-dev/react-native-starter/issues/109)).**
  - It strips the query from URLs only under keys that *end* like a URL key, so
    `linkText` keeps its text.
  - Screen tracking reports the screen the user sees, not a launch URL that a
    guard redirected.
- **Accessibility ([#103](https://github.com/koniz-dev/react-native-starter/issues/103), [#109](https://github.com/koniz-dev/react-native-starter/issues/109)).**
  - Headings are marked as headings.
  - The demo screens announce their status changes on iOS.
- **`docs:check` ([#104](https://github.com/koniz-dev/react-native-starter/issues/104), [#107](https://github.com/koniz-dev/react-native-starter/issues/107)).**
  - It now checks every link form: titled, angle-bracket, reference, and HTML
    links, plus inline-code `.md#anchor` references.
  - It understands `~~~` fences and reports a fence left open.
  - It handles footnotes, setext headings, and parentheses in link targets.
- **Lint ([#104](https://github.com/koniz-dev/react-native-starter/issues/104)).** A new rule disallows `@/` imports
  within the same feature.
- **Tests and CI ([#105](https://github.com/koniz-dev/react-native-starter/issues/105)).**
  - Jest `clearMocks` and `restoreMocks` are on.
  - CI keeps a result for every commit on `main`.
  - Expo patch updates: expo 57.0.30, expo-router 57.0.28, expo-constants
    57.0.22, expo-linking 57.0.13.
  - A new favicon.
- **E2E ([#101](https://github.com/koniz-dev/react-native-starter/issues/101), [#110](https://github.com/koniz-dev/react-native-starter/issues/110)).**
  - A new manual workflow, **E2E (iOS, manual)** (`.github/workflows/e2e-ios.yml`),
    builds the native debug app on macOS 26 and runs the flows. Its `ref` input
    can test an older commit. `init-project` rewrites its IDs.
  - The flows open the app's link only in Expo Go.
  - A new `subflows/type-username.yaml` types the username, checks it, and
    retries. Copy it together with `subflows/sign-in.yaml`.
  - Sign-in waits for iOS's late "Save Password?" sheet.
- 582 tests, or 488 after `init-project --remove-demo --remove-recipes`.

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
- **GitHub Actions, iOS:** an iPhone 17 simulator on iOS 26.5, on `macos-26`,
  with the native debug build. 7 flows plus dark mode.
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
  maintainers' machine has Xcode 16.4, and SDK 57 needs 26.4+. A run takes
  about 40 minutes. The iOS simulator there is flaky in ways #110 works
  around (link-open timeouts, dropped keystrokes, a late "Save Password?"
  sheet). If a run fails, read its artifacts before you rerun it.
- **Web keeps the token in memory**, so reloading the page signs you out. This
  is documented in API and Storage.
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
- **Expo SDK 58 is close.** Under the support policy, the starter moves to SDK 58
  within about 4 weeks of its release.

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
